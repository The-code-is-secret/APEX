const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid'); // Import uuid for unique IDs
const dockerService = require("./dockerService");
const TerminalSession = require("../models/TerminalSession");
const User = require("../models/User");

// Map to store active socket connections
const activeSessions = new Map();

// --- Helper Function for Cleanup ---
const cleanupSessionResources = (sessionId, reason) => {
    const sessionData = activeSessions.get(sessionId);
    if (sessionData) {
        const { stream, setupInstanceId } = sessionData;
        console.log(`[Terminal ${sessionId} / ${setupInstanceId}] Cleaning up resources. Reason: ${reason}`);
        if (stream) {
            try {
                stream.removeAllListeners(); // Explicitly remove listeners
                stream.end();
                console.log(`[Terminal ${sessionId} / ${setupInstanceId}] Stream ended and listeners removed.`);
            } catch (error) {
                console.error(`[Terminal ${sessionId} / ${setupInstanceId}] Error ending stream during cleanup:`, error);
            }
        }
        activeSessions.delete(sessionId);
        console.log(`[Terminal ${sessionId} / ${setupInstanceId}] Session removed from activeSessions.`);
    } else {
        console.log(`[Terminal ${sessionId}] Cleanup requested, but session not found in activeSessions. Reason: ${reason}`);
    }
};


// Setup Socket.io server
const setupSocketServer = (io) => {
  // Extract authentication logic into a reusable function
  const authenticateSocket = async (socket, next) => {
    console.log(`[Auth] Socket ${socket.id} authentication attempt`);
    try {
      if (!socket.handshake.query || !socket.handshake.query.token) {
        console.log(`[Auth] Socket ${socket.id} missing token`);
        return next(new Error("Authentication error: Token missing"));
      }

      const token = socket.handshake.query.token;
      console.log(`[Auth] Verifying token for socket ${socket.id}`);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      console.log(`[Auth] Finding user ID: ${decoded.id}`);
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log(`[Auth] User not found for ID: ${decoded.id}`);
        return next(new Error("Authentication error: User not found"));
      }

      // Check if admin
      if (user.role !== "admin") {
        console.log(`[Auth] User ${user._id} is not admin`);
        return next(new Error("Authorization error: Admin access required"));
      }

      // Add user to socket
      console.log(`[Auth] Adding user ${user._id} to socket ${socket.id}`);
      socket.user = user;
      next();
    } catch (error) {
      console.error(
        `[Auth] Error authenticating socket ${socket.id}:`,
        error.message
      );
      return next(new Error("Authentication error: Invalid token"));
    }
  };

  // Apply auth middleware to main io instance (optional)
  io.use(authenticateSocket);

  // Terminal namespace
  const terminal = io.of("/terminal");

  // IMPORTANT: Apply auth middleware to terminal namespace
  terminal.use(authenticateSocket);

  terminal.on("connection", async (socket) => {
    const connectionTimestamp = new Date().toISOString();
    const sessionId = socket.handshake.query.sessionId;
    console.log(
      `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} connected for session ${sessionId} with user:`,
      socket.user._id
    );

    if (!sessionId) {
      console.log(
        `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - No sessionId provided. Disconnecting.`
      );
      socket.emit("error", { message: "Session ID is required" });
      socket.disconnect();
      return;
    }

    // --- Check if another socket is already actively managing this session ---
    const existingSessionData = activeSessions.get(sessionId);
    if (
      existingSessionData &&
      existingSessionData.socket &&
      existingSessionData.socket.id !== socket.id
    ) {
      // If a different socket is already attached and has a stream or is setting up
      if (existingSessionData.stream || existingSessionData.setupInProgress) {
        console.warn(
          `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Session ${sessionId} is already actively managed by socket ${existingSessionData.socket.id}. Disconnecting new socket.`
        );
        socket.emit("error", { message: "Session already active elsewhere." });
        socket.disconnect();
        return;
      } else {
        console.warn(
          `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Session ${sessionId} exists in map but seems inactive (no stream/setupInProgress). Attempting to take over.`
        );
        // Allow this new socket to proceed and potentially overwrite the old entry.
      }
    }
    // --- End Check ---

    try {
      // Verify session in DB (keep this check)
      console.log(
        `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Looking up session ${sessionId} in DB.`
      );
      const session = await TerminalSession.findById(sessionId);
      // ... (DB session checks for existence, status, ownership - keep these as they are) ...
      if (!session) {
        console.log(
          `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Session ${sessionId} not found in DB`
        );
        socket.emit("error", { message: "Terminal session not found" });
        socket.disconnect();
        return;
      }
      if (session.status !== "active") {
        console.log(
          `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Session ${sessionId} not active in DB: ${session.status}`
        );
        socket.emit("error", { message: "Terminal session is not active" });
        socket.disconnect();
        return;
      }
      if (session.admin.toString() !== socket.user._id.toString()) {
        console.log(
          `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Unauthorized user ${socket.user._id} for session ${sessionId}`
        );
        socket.emit("error", { message: "Not authorized for this session" });
        socket.disconnect();
        return;
      }

      // --- Call Setup Function ---
      // Pass the unique ID for logging this specific setup attempt
      const setupInstanceId = uuidv4().substring(0, 8);
      await setupTerminalSession(socket, sessionId, setupInstanceId);

      // --- Robust Disconnect Handler ---
      socket.on("disconnect", (reason) => {
        const disconnectTimestamp = new Date().toISOString();
        console.log(
          `[Terminal Disconnect @ ${disconnectTimestamp}] Socket ${socket.id} disconnected. Session: ${sessionId}. Reason: ${reason}`
        );
        // Only cleanup if THIS socket was the one managing the session
        const currentSessionData = activeSessions.get(sessionId);
        if (
          currentSessionData &&
          currentSessionData.socket &&
          currentSessionData.socket.id === socket.id
        ) {
          cleanupSessionResources(
            sessionId,
            `Socket ${socket.id} disconnected`
          );
        } else if (currentSessionData) {
          console.log(
            `[Terminal Disconnect @ ${disconnectTimestamp}] Socket ${socket.id} disconnected, but session ${sessionId} is managed by socket ${currentSessionData.socket?.id}. No cleanup by this socket.`
          );
        } else {
          console.log(
            `[Terminal Disconnect @ ${disconnectTimestamp}] Socket ${socket.id} disconnected, session ${sessionId} not found in activeSessions. No cleanup needed.`
          );
        }
      });
    } catch (error) {
      console.error(
        `[Terminal Connection @ ${connectionTimestamp}] Socket ${socket.id} - Error during connection/setup initiation for session ${sessionId}:`,
        error
      );
      socket.emit("error", {
        message: "Failed to initiate terminal session connection",
      });
      socket.disconnect(); // Ensure disconnect on error
      // Attempt cleanup just in case something was partially added
      cleanupSessionResources(
        sessionId,
        `Error during connection for socket ${socket.id}`
      );
    }
  });
};

// Set up terminal session with Docker container
const setupTerminalSession = async (socket, sessionId, setupInstanceId) => {
  const timestamp = new Date().toISOString();

  // --- STRONGER GUARD ---
  // Check map right before attempting to modify it
  const existingSession = activeSessions.get(sessionId);
  if (existingSession) {
    // If setup is in progress OR completed (stream exists) by ANY instance, abort.
    if (existingSession.setupInProgress || existingSession.stream) {
      console.warn(
        `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Setup aborted: Session setup already completed or in progress (by instance ${existingSession.setupInstanceId}).`
      );
      return;
    }
    console.warn(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Found stale session entry. Overwriting.`
    );
  }
  // --- END GUARD ---

  // Place placeholder, mark as IN PROGRESS with unique ID and the current socket
  console.log(
    `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Placing setup placeholder.`
  );
  activeSessions.set(sessionId, {
    socket: socket,
    container: null,
    stream: null,
    setupInProgress: true,
    setupInstanceId: setupInstanceId,
  });

  try {
    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Getting container...`
    );
    const container = await dockerService.getContainer(sessionId);
    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Got container.`
    );

    // --- Double check guard *after* getting container (long async step) ---
    const currentSessionState = activeSessions.get(sessionId);
    if (
      !currentSessionState ||
      currentSessionState.setupInstanceId !== setupInstanceId ||
      !currentSessionState.setupInProgress
    ) {
      console.warn(
        `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Setup aborted after getting container: State changed or another instance took over.`
      );
      // Don't delete from activeSessions here, the other instance is managing it.
      return;
    }
    // --- End double check ---

    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Attaching to container stream...`
    );
    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true,
    });
    stream.resume();
    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Stream attached successfully.`
    );

    // --- Update activeSessions: Set stream, container, mark setup COMPLETE ---
    // Use functional update to avoid race conditions if map is modified elsewhere (less likely here)
    activeSessions.set(sessionId, {
      ...currentSessionState,
      container: container,
      stream: stream,
      setupInProgress: false,
    });
    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Updated activeSessions, setup complete.`
    );

    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Disabling container TTY echo.`
    );
    stream.write("stty -echo\n");

    // --- Stream Event Listeners ---
    stream.on("data", (chunk) => {
      const listenerTimestamp = new Date().toISOString();
      const currentSession = activeSessions.get(sessionId); // Check current state
      // Check if session exists AND if the stream in the map is THIS stream
      if (!currentSession || currentSession.stream !== stream) {
        console.warn(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${listenerTimestamp}] Received stream data but session inactive or stream mismatch. Current stream in map belongs to instance ${currentSession?.setupInstanceId}. Ignoring.`
        );
        return;
      }
      console.log(
        `[Terminal ${sessionId} / ${setupInstanceId} @ ${listenerTimestamp}] Received data (${
          chunk.toString().length
        } bytes). Emitting to client ${socket.id}.`
      );
      socket.emit("output", chunk.toString());
    });

    stream.on("end", () => {
      const listenerTimestamp = new Date().toISOString();
      console.log(
        `[Terminal ${sessionId} / ${setupInstanceId} @ ${listenerTimestamp}] Container stream ended.`
      );
      // Cleanup initiated by stream ending
      cleanupSessionResources(
        sessionId,
        `Stream ended for instance ${setupInstanceId}`
      );
      socket.emit("terminated", { message: "Terminal session ended" });
    });

    stream.on("error", (error) => {
      const listenerTimestamp = new Date().toISOString();
      console.error(
        `[Terminal ${sessionId} / ${setupInstanceId} @ ${listenerTimestamp}] Stream error:`,
        error
      );
      // Cleanup initiated by stream error
      cleanupSessionResources(
        sessionId,
        `Stream error for instance ${setupInstanceId}: ${error.message}`
      );
      socket.emit("error", {
        message: "Terminal connection error: " + error.message,
      });
    });

    // --- Socket Event Listeners (Input, Resize) ---
    // (These are specific to the socket, so less prone to duplication issues if guard works)
    let lineBuffer = "";
    socket.on("input", (data) => {
      const inputTimestamp = new Date().toISOString();
      const currentInputSession = activeSessions.get(sessionId); // Check state before writing
      if (
        !currentInputSession ||
        !currentInputSession.stream ||
        currentInputSession.socket.id !== socket.id
      ) {
        console.warn(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${inputTimestamp}] Input received but session/stream inactive or socket mismatch. Ignoring.`
        );
        return;
      }
      const { stream: sessionStream } = currentInputSession;
      // ... (rest of input logic) ...
      if (data === "\x7F") {
        console.log(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${inputTimestamp}] Received Backspace. Sending.`
        );
        sessionStream.write(data);
        lineBuffer = lineBuffer.slice(0, -1);
        return;
      } else if (data.charCodeAt(0) < 32 && data !== "\n" && data !== "\r") {
        console.log(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${inputTimestamp}] Received Control Char. Sending.`
        );
        sessionStream.write(data);
        return;
      }
      lineBuffer += data;
      while (lineBuffer.includes("\n") || lineBuffer.includes("\r")) {
        let lineEndIndex = lineBuffer.search(/[\n\r]/);
        let commandToSend = lineBuffer.substring(0, lineEndIndex);
        let nextCharIndex = lineEndIndex + 1;
        if (
          lineBuffer[lineEndIndex] === "\r" &&
          lineBuffer[nextCharIndex] === "\n"
        ) {
          nextCharIndex++;
        }
        lineBuffer = lineBuffer.substring(nextCharIndex);
        commandToSend += "\n";
        console.log(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${inputTimestamp}] Sending command: "${commandToSend.replace(
            /\n/g,
            "\\n"
          )}"`
        );
        sessionStream.write(commandToSend);
        if (lineBuffer.length === 0) break;
      }
    });

    socket.on("resize", async (data) => {
      const resizeTimestamp = new Date().toISOString();
      const currentResizeSession = activeSessions.get(sessionId);
      if (
        !currentResizeSession ||
        !currentResizeSession.container ||
        currentResizeSession.socket.id !== socket.id
      ) {
        console.warn(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${resizeTimestamp}] Resize received but session/container inactive or socket mismatch. Ignoring.`
        );
        return;
      }
      try {
        console.log(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${resizeTimestamp}] Resizing container to ${data.cols}x${data.rows}`
        );
        await currentResizeSession.container.resize({
          h: data.rows,
          w: data.cols,
        });
      } catch (error) {
        console.error(
          `[Terminal ${sessionId} / ${setupInstanceId} @ ${resizeTimestamp}] Resize error:`,
          error
        );
        socket.emit("error", {
          message: "Failed to resize terminal: " + error.message,
        });
      }
    });

    // --- Final Setup Steps ---
    console.log(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${timestamp}] Setup function completed successfully.`
    );
    socket.emit("connected", {
      message: "Terminal session connected successfully",
    });
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(
      `[Terminal ${sessionId} / ${setupInstanceId} @ ${errorTimestamp}] Setup error:`,
      error
    );
    // Cleanup initiated by setup error
    cleanupSessionResources(
      sessionId,
      `Setup error for instance ${setupInstanceId}: ${error.message}`
    );
    socket.emit("error", {
      message: "Failed to connect to terminal session: " + error.message,
    });
    // socket.disconnect(); // Disconnect is handled by the caller in terminal.on('connection')
  }
};


module.exports = {
  setupSocketServer,
};
