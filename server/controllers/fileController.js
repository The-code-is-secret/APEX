const Project = require('../models/Project');
const path = require('path');
const fs = require('fs');

// Helper function for consistent logging and checks
const checkAndDownload = async (req, res, next, filePathField, fileTypeLabel, defaultExtension) => {
  const projectId = req.params.projectId;
  console.log(`[Download ${fileTypeLabel}] Request received for project ID: ${projectId}`);
  console.log(`[Download ${fileTypeLabel}] User ID: ${req.user._id}, Role: ${req.user.role}`);

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      console.error(`[Download ${fileTypeLabel}] Project not found: ${projectId}`);
      res.status(404);
      throw new Error('Project not found');
    }
    console.log(`[Download ${fileTypeLabel}] Project found: ${project.name}, Student: ${project.student}`);

    // Check permissions
    if (req.user.role === 'student' && project.student.toString() !== req.user._id.toString()) {
      console.warn(`[Download ${fileTypeLabel}] Unauthorized access attempt by user ${req.user._id} (student) for project ${projectId} owned by ${project.student}`);
      res.status(403);
      throw new Error('Not authorized to access this file');
    }
    console.log(`[Download ${fileTypeLabel}] Authorization successful.`);

    const filePathFromDB = project[filePathField];
    if (!filePathFromDB) {
        console.error(`[Download ${fileTypeLabel}] File path field '${filePathField}' is missing or empty in the project document for project ${projectId}`);
        res.status(404);
        throw new Error(`${fileTypeLabel} file path not configured for this project.`);
    }
    console.log(`[Download ${fileTypeLabel}] Raw file path from DB ('${filePathField}'): ${filePathFromDB}`);

    // --- Path Resolution ---
    // Decide how to resolve the path. If paths in DB are relative to project root or a specific uploads dir:
    // Example: Assuming paths are relative to an 'uploads' directory two levels up from 'controllers'
    // const absoluteFilePath = path.resolve(__dirname, '..', '..', filePathFromDB); // Adjust '..' based on your structure
    // If paths in DB are already absolute or should be resolved from CWD:
    const absoluteFilePath = path.resolve(filePathFromDB);
    // --- Choose the correct resolution method above ---

    console.log(`[Download ${fileTypeLabel}] Resolved absolute file path for check: ${absoluteFilePath}`);

    // Check if file exists using the resolved path
    if (!fs.existsSync(absoluteFilePath)) {
      console.error(`[Download ${fileTypeLabel}] CRITICAL: File does not exist at resolved path: ${absoluteFilePath}`);
      res.status(404);
      // Provide a more specific error message
      throw new Error(`${fileTypeLabel} file not found on server at the expected location.`);
    }
    console.log(`[Download ${fileTypeLabel}] File confirmed to exist at: ${absoluteFilePath}`);

    // Construct suggested filename (sanitize more robustly)
    const suggestedFilename = `${project.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}.${defaultExtension}`;
    console.log(`[Download ${fileTypeLabel}] Attempting to send file via res.download: Path='${absoluteFilePath}', Suggested Filename='${suggestedFilename}'`);

    // Send file using the resolved absolute path
    res.download(absoluteFilePath, suggestedFilename, (err) => {
        // This callback executes after the transfer attempt (success or failure)
        if (err) {
            // An error occurred during the actual file streaming
            console.error(`[Download ${fileTypeLabel}] Error occurred *during* res.download stream for ${absoluteFilePath}:`, err);
            // Check if headers were already sent, as we might not be able to send a new error response
            if (!res.headersSent) {
                 console.error(`[Download ${fileTypeLabel}] Headers not sent, passing error to Express handler.`);
                 // Pass a generic or specific error to the client via the error handler
                 next(new Error(`Failed to download ${fileTypeLabel} file due to a server error.`));
            } else {
                 console.error(`[Download ${fileTypeLabel}] Headers already sent, cannot send new error response.`);
            }
        } else {
            // Successfully initiated download (doesn't guarantee client received it fully)
            console.log(`[Download ${fileTypeLabel}] Successfully initiated download stream for: ${absoluteFilePath}`);
        }
    });

  } catch (error) {
    console.error(`[Download ${fileTypeLabel}] Error caught in main try block for project ${projectId}:`, error.message);
    // Ensure error is passed to Express error handler if headers aren't sent
    if (!res.headersSent) {
        next(error); // Forward the original error or a new one
    } else {
        console.error(`[Download ${fileTypeLabel}] Error occurred after headers were sent (main try block).`);
    }
  }
};


// @desc    Download project zip file
// @route   GET /api/files/download/zip/:projectId
// @access  Private
const downloadZipFile = (req, res, next) => {
  checkAndDownload(req, res, next, 'zipFilePath', 'ZIP', 'zip');
};

// @desc    Download project LaTeX file
// @route   GET /api/files/download/latex/:projectId
// @access  Private
const downloadLatexFile = (req, res, next) => {
  checkAndDownload(req, res, next, 'latexFilePath', 'LaTeX', 'tex');
};

module.exports = {
  downloadZipFile,
  downloadLatexFile
};