const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const extract = require("extract-zip");
const TerminalSession = require("../models/TerminalSession");
const Project = require("../models/Project");

// --- Corrected Docker Initialization ---
let dockerOptions = { version: "v1.48" }; // Base options

if (process.env.DOCKER_HOST) {
  // If DOCKER_HOST is set, parse it for TCP connection
  console.log("Attempting Docker connection via DOCKER_HOST:", process.env.DOCKER_HOST);
  try {
    const url = new URL(process.env.DOCKER_HOST);
    dockerOptions.host = url.hostname;
    dockerOptions.port = url.port;
    // Note: Add protocol handling if needed, e.g., for TLS
  } catch (e) {
    console.error("Invalid DOCKER_HOST URL format. Falling back.", e);
    // Fallback to socket path if host parsing fails or if you prefer socket first
    if (process.env.DOCKER_SOCKET && fs.existsSync(process.env.DOCKER_SOCKET)) {
       console.log("Falling back to Docker connection via DOCKER_SOCKET:", process.env.DOCKER_SOCKET);
       dockerOptions = { socketPath: process.env.DOCKER_SOCKET, version: "v1.48" };
    } else {
       console.warn("DOCKER_HOST invalid and DOCKER_SOCKET not found or not set. Using default pipe.");
       dockerOptions = { socketPath: '//./pipe/docker_engine', version: "v1.48" }; // Default Windows pipe
    }
  }
} else if (process.env.DOCKER_SOCKET && fs.existsSync(process.env.DOCKER_SOCKET)) {
  // If DOCKER_HOST is not set, use DOCKER_SOCKET if it exists
  console.log("Attempting Docker connection via DOCKER_SOCKET:", process.env.DOCKER_SOCKET);
  dockerOptions = { socketPath: process.env.DOCKER_SOCKET, version: "v1.48" };
} else {
   // Default fallback if neither is set or socket doesn't exist
   console.log("DOCKER_HOST and DOCKER_SOCKET not configured or socket not found. Using default pipe.");
   dockerOptions = { socketPath: '//./pipe/docker_engine', version: "v1.48" }; // Default Windows pipe
}

console.log("Final Docker Options:", dockerOptions);
const docker = new Docker(dockerOptions);
// --- End of Corrected Initialization ---


const checkDockerRunning = async () => {
  try {
    // Use the configured docker object now
    console.log("Pinging Docker daemon with options:", docker.modem.options);
    await docker.ping();
    console.log("Docker daemon connection successful");
    return true;
  } catch (error) {
    console.error("Docker daemon connection error:", error.message);
    // Log the options used for debugging
    console.error("Docker connection options used:", docker.modem.options);
    console.error("Full Docker connection error details:", error);

    // Keep the checks for Docker installation and running status
    try {
      const { execSync } = require("child_process");
      const dockerVersion = execSync("docker --version").toString();
      console.log("Docker installation check:", dockerVersion.trim());
    } catch (e) {
      console.error("Docker does not seem to be installed or in PATH");
    }
    try {
      const { execSync } = require("child_process");
      // Use a command less likely to hang if daemon is unresponsive
      const dockerInfo = execSync("docker info --format '{{.ServerVersion}}'").toString();
      console.log("Docker running status check: Responded with version", dockerInfo.trim());
    } catch (e) {
      console.error("Docker daemon check failed. Is Docker Desktop running?");
    }

    return false;
  }
};

// Extract a zip file - Windows compatible paths
const extractProjectZip = async (zipPath, projectId) => {
  const extractPath = path.join(
    __dirname,
    `..${path.sep}..${path.sep}uploads${path.sep}extracted${path.sep}${projectId}`
  );

  // Create directory if it doesn't exist
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  try {
    await extract(zipPath, { dir: extractPath });
    return extractPath;
  } catch (err) {
    console.error("Extraction error:", err);
    throw new Error("Failed to extract project zip file");
  }
};

// Ensure Docker image exists
const ensureDockerImage = async (imageName) => {
  try {
    console.log(`Checking if Docker image ${imageName} exists locally...`);
    const images = await docker.listImages();
    const exists = images.some(
      (img) => img.RepoTags && img.RepoTags.includes(imageName)
    );

    if (!exists) {
      console.log(`Docker image ${imageName} not found locally, pulling...`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err) => {
            if (err) return reject(err);
            console.log(`Successfully pulled ${imageName}`);
            resolve();
          });
        });
      });
    } else {
      console.log(`Docker image ${imageName} found locally`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to ensure Docker image ${imageName}:`, err);
    return false;
  }
};

// Create and start a Docker container - Adapted for Windows path handling
const startContainer = async (projectId, adminId) => {
  try {
    console.log("Starting container for project:", projectId);
    const isDockerRunning = await checkDockerRunning();
    if (!isDockerRunning) {
      throw new Error(
        "Docker daemon is not accessible. Please ensure Docker Desktop is running."
      );
    }
    try {
      console.log("Testing Docker API by listing containers...");
      const containers = await docker.listContainers();
      console.log("Successfully listed containers:", containers.length);
    } catch (listError) {
      console.error("Failed to list containers:", listError);
      throw new Error(`Docker API test failed: ${listError.message}`);
    }
    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Extract project if not already extracted
    let extractedPath = project.extractedPath;
    if (!extractedPath) {
      extractedPath = await extractProjectZip(project.zipFilePath, projectId);

      // Update project with extracted path
      await Project.findByIdAndUpdate(projectId, { extractedPath });
    }

    // Call this before creating the container
    await ensureDockerImage(process.env.DOCKER_BASE_IMAGE);

    // Windows path conversion for Docker bind mounting
    const windowsPath = extractedPath.replace(/\\/g, "/");

    // Create container - Adjusted for Windows
    const container = await docker.createContainer({
      Image: process.env.DOCKER_BASE_IMAGE,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      HostConfig: {
        Binds: [`${windowsPath}:/app`],
        Memory: 512 * 1024 * 1024, // 512MB memory limit
        MemorySwap: 1024 * 1024 * 1024, // 1GB swap
        CpusetCpus: "0", // Use only first CPU core
        NetworkMode: "bridge",
        SecurityOpt: ["no-new-privileges:true"],
      },
      WorkingDir: "/app",
      Cmd: ["/bin/sh"],
      Env: ["TERM=xterm"],
    });

    // Start container
    await container.start();

    // Create a terminal session record
    const session = await TerminalSession.create({
      project: projectId,
      admin: adminId,
      containerId: container.id,
      status: "active",
    });

    return {
      sessionId: session._id,
      containerId: container.id,
    };
  } catch (error) {
    console.error("Docker container creation error:", error);
    throw new Error("Failed to start terminal session");
  }
};

// Terminate a container
const terminateContainer = async (sessionId) => {
  try {
    // Find session
    const session = await TerminalSession.findById(sessionId);

    if (!session) {
      throw new Error("Terminal session not found");
    }

    if (session.status === "terminated") {
      return { message: "Session already terminated" };
    }

    // Get container
    const container = docker.getContainer(session.containerId);

    // Stop and remove container
    await container.stop();
    await container.remove();

    // Update session
    session.status = "terminated";
    session.endTime = new Date();
    await session.save();

    return { message: "Terminal session terminated successfully" };
  } catch (error) {
    console.error("Docker container termination error:", error);
    throw new Error("Failed to terminate terminal session");
  }
};

// Get container for an active session - with container status check and recreation
const getContainer = async (sessionId) => {
  try {
    console.log(`[Docker] Getting container for session ${sessionId}`);
    const session = await TerminalSession.findById(sessionId);

    if (!session) {
      console.error(`[Docker] Terminal session ${sessionId} not found`);
      throw new Error("Terminal session not found");
    }

    if (session.status !== "active") {
      console.error(`[Docker] Terminal session ${sessionId} is not active`);
      throw new Error("Terminal session is not active");
    }

    // Get container instance
    const containerId = session.containerId;
    const container = docker.getContainer(containerId);
    
    // Check if container exists and is running
    try {
      console.log(`[Docker] Checking status of container ${containerId}`);
      const containerInfo = await container.inspect();
      
      if (!containerInfo.State.Running) {
        console.log(`[Docker] Container ${containerId} exists but is not running. Will recreate.`);
        return await recreateContainer(session);
      }
      
      console.log(`[Docker] Container ${containerId} is running properly`);
      return container;
    } catch (containerError) {
      // Container might not exist anymore
      if (containerError.statusCode === 404) {
        console.log(`[Docker] Container ${containerId} not found. Will recreate.`);
        return await recreateContainer(session);
      }
      throw containerError; // Other errors
    }
  } catch (error) {
    console.error(`[Docker] Get container error:`, error);
    throw new Error(`Failed to get container for session: ${error.message}`);
  }
};

// Helper function to recreate a container from a session
const recreateContainer = async (session) => {
  try {
    console.log(`[Docker] Recreating container for session ${session._id}`);
    
    // Find project to get the extracted path
    const project = await Project.findById(session.project);
    if (!project) {
      throw new Error("Project not found for session");
    }
    
    console.log(`[Docker] Found project ${project._id} for container recreation`);
    
    // Check if extracted path exists
    if (!project.extractedPath) {
      console.log(`[Docker] Project has no extracted path. Extracting zip file.`);
      project.extractedPath = await extractProjectZip(project.zipFilePath, project._id);
      await project.save();
    }
    
    // Windows path conversion for Docker bind mounting
    const windowsPath = project.extractedPath.replace(/\\/g, "/");
    
    // Create new container
    console.log(`[Docker] Creating new container for project ${project._id}`);
    const container = await docker.createContainer({
      Image: process.env.DOCKER_BASE_IMAGE,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      HostConfig: {
        Binds: [`${windowsPath}:/app`],
        Memory: 512 * 1024 * 1024, // 512MB memory limit
        MemorySwap: 1024 * 1024 * 1024, // 1GB swap
        CpusetCpus: "0", // Use only first CPU core
        NetworkMode: "bridge",
        SecurityOpt: ["no-new-privileges:true"],
      },
      WorkingDir: "/app",
      Cmd: ["/bin/sh"],
      Env: ["TERM=xterm"],
    });
    
    // Start container
    console.log(`[Docker] Starting new container with ID ${container.id}`);
    await container.start();
    
    // Update session with new container ID
    const oldContainerId = session.containerId;
    session.containerId = container.id;
    await session.save();
    
    console.log(`[Docker] Updated session ${session._id} with new container ID ${container.id} (was: ${oldContainerId})`);
    
    return container;
  } catch (error) {
    console.error(`[Docker] Container recreation error:`, error);
    throw new Error(`Failed to recreate container: ${error.message}`);
  }
};

module.exports = {
  startContainer,
  terminateContainer,
  getContainer,
  extractProjectZip,
  checkDockerRunning,
};
