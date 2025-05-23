import React, { useEffect, useRef, useState, useCallback } from "react"; // Added useCallback
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import io from "socket.io-client";
import {
  makeStyles,
  Button,
  Typography,
  Paper,
  // Grid,
  CircularProgress,
} from "@material-ui/core";
import {
  startTerminal,
  terminateTerminal,
  terminalConnected,
  terminalDisconnected,
} from "../../redux/actions/terminalActions";
import { getProject } from "../../redux/actions/projectActions";
import "xterm/css/xterm.css";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  terminal: {
    height: "400px",
    backgroundColor: "#000",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
}));

const Terminal = ({
  auth: { user },
  terminal: { sessionId, isActive, isConnected, loading },
  project: { project, loading: projectLoading },
  startTerminal,
  terminateTerminal,
  terminalConnected,
  terminalDisconnected,
  getProject,
}) => {
  const classes = useStyles();
  const { projectId } = useParams();
  const history = useHistory();
  const terminalRef = useRef(null); // DOM element for xterm
  const socketRef = useRef(null); // Socket instance
  const xtermRef = useRef(null); // Xterm instance
  const fitAddonRef = useRef(null); // Xterm FitAddon instance
  const [initializing, setInitializing] = useState(true);
  const inputBuffer = useRef("");

  // --- Centralized Cleanup Function ---
  const cleanupTerminalResources = useCallback(() => {
    console.log("[Client Cleanup] Cleaning up terminal resources...");
    // Disconnect socket and remove listeners
    if (socketRef.current) {
      console.log("[Client Cleanup] Disconnecting socket...");
      socketRef.current.disconnect();
      socketRef.current = null; // Clear ref
    }
    // Dispose xterm instance
    if (xtermRef.current) {
      console.log("[Client Cleanup] Disposing xterm instance...");
      xtermRef.current.dispose();
      xtermRef.current = null; // Clear ref
      fitAddonRef.current = null; // Addon is disposed with xterm
    }
    // Reset input buffer
    inputBuffer.current = "";
    // Optionally dispatch disconnected state if not already handled by socket disconnect event
    // dispatch(terminalDisconnected()); // Consider if needed here or rely on socket event
  }, [terminalDisconnected]); // Include dispatch if used directly

  // Get project data
  useEffect(() => {
    getProject(projectId);
  }, [getProject, projectId]);

  // Update initializing state
  useEffect(() => {
    if (!projectLoading && project && initializing) {
      setInitializing(false);
    }
  }, [projectLoading, project, initializing]);

  // --- Terminal Initialization ---
  const initTerminal = useCallback(
    (sid) => {
      // Prevent re-initialization if already exists
      if (xtermRef.current || socketRef.current) {
        console.warn(
          "[Client Init] Attempted to initialize terminal when already initialized. Aborting."
        );
        return;
      }
      console.log(`[Client Init] Initializing terminal for session: ${sid}`);

      try {
        // Create terminal instance
        xtermRef.current = new XTerminal({
          cursorBlink: true,
          cursorStyle: "bar",
          fontFamily: "monospace",
          fontSize: 14,
          theme: {
            background: "#000000",
            foreground: "#ffffff",
          },
          convertEol: true, // Convert \r\n to \n
          // Disable default handling if using custom key handler (optional but cleaner)
          // disableStdin: true, // We will handle input via onData
        });
        fitAddonRef.current = new FitAddon();
        xtermRef.current.loadAddon(fitAddonRef.current);
        xtermRef.current.open(terminalRef.current);
        fitAddonRef.current.fit();

        // Connect to socket.io server
        socketRef.current = io("/terminal", {
          query: { token: localStorage.getItem("token"), sessionId: sid },
        });

        // --- Socket Event Listeners ---
        socketRef.current.on("connect", () => {
          console.log("[Client] Socket connected to terminal namespace");
          terminalConnected();
          // Fit terminal on connect after potential layout shifts
          setTimeout(() => fitAddonRef.current?.fit(), 100);
        });

        socketRef.current.on("output", (data) => {
          console.log("[Client] Received output:", data);
          // *** ADD DETAILED LOGGING HERE ***
          const timestamp = new Date().toLocaleTimeString();
          console.log(
            `[Client Output ${timestamp}] Received ${data.length} chars. Writing to xterm.`
          );
          if (xtermRef.current) {
            xtermRef.current.write(data);
          } else {
            console.warn(
              `[Client Output ${timestamp}] Received data but xtermRef is null!`
            );
          }
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log(`[Client] Socket disconnected: ${reason}`);
          if (xtermRef.current) {
            xtermRef.current.writeln(
              `\r\n\r\n[Socket disconnected: ${reason}]\r\n`
            );
          }
          // Ensure cleanup happens on disconnect
          cleanupTerminalResources();
          // Update Redux state
          terminalDisconnected();
        });

        socketRef.current.on("error", (data) => {
          console.error(`[Client] Socket error: ${data.message}`);
          if (xtermRef.current) {
            xtermRef.current.writeln(`\r\n\r\n[ERROR: ${data.message}]\r\n`);
          }
          // Terminate on error
          handleTerminateTerminal(); // Use the terminate handler for full cleanup
        });

        socketRef.current.on("terminated", (data) => {
          console.log(`[Client] Received terminated event: ${data.message}`);
          if (xtermRef.current) {
            xtermRef.current.writeln(`\r\n\r\n[${data.message}]\r\n`);
          }
          // Ensure cleanup happens
          cleanupTerminalResources();
          // Update Redux state if needed (terminateTerminal action might handle this)
        });

        // --- Input Handling (Modified - No Local Echo for Printables) ---
        inputBuffer.current = ""; // Reset buffer
        xtermRef.current.onData((data) => {
          if (!socketRef.current || !socketRef.current.connected) {
            console.warn(
              "[Client Input] Input received but socket is not connected."
            );
            return;
          }

          const code = data.charCodeAt(0);
          const timestamp = new Date().toLocaleTimeString(); // For logging

          if (data === "\r") {
            // Enter key (carriage return)
            console.log(
              `[Client Input ${timestamp}] Enter pressed. Sending buffer: "${inputBuffer.current}\\n"`
            );
            if (socketRef.current) {
              // Send the buffered command + newline
              socketRef.current.emit("input", inputBuffer.current + "\n");
            }
            // Local echo for Enter
            xtermRef.current.write("\r\n");
            inputBuffer.current = ""; // Clear local buffer
          } else if (data === "\x7F") {
            // Backspace (DEL)
            if (inputBuffer.current.length > 0) {
              console.log(`[Client Input ${timestamp}] Backspace pressed.`);
              // Local echo for Backspace
              xtermRef.current.write("\b \b");
              // Remove last character from local buffer
              inputBuffer.current = inputBuffer.current.slice(0, -1);
              // Send Backspace control character to backend (The backend needs to handle this)
              if (socketRef.current) {
                console.log(
                  `[Client Input ${timestamp}] Sending Backspace (\\x7F) to backend.`
                );
                socketRef.current.emit("input", data); // Send \x7F
              }
            } else {
              console.log(
                `[Client Input ${timestamp}] Backspace pressed but buffer is empty.`
              );
            }
          } else if (code < 32) {
            // Other Control Characters (like Ctrl+C \x03)
            console.log(
              `[Client Input ${timestamp}] Control character (code: ${code}). Sending immediately to backend.`
            );
            // Send control characters immediately
            if (socketRef.current) {
              socketRef.current.emit("input", data);
            }
            // No local echo for control characters usually
          } else if (code >= 32) {
            // Printable Characters
            console.log(
              `[Client Input ${timestamp}] Printable character: '${data}'. Local echo + Buffering.`
            );
            // --- RE-ENABLE LOCAL ECHO ---
            xtermRef.current.write(data); // Echo locally

            // Append to local buffer
            inputBuffer.current += data;

            // --- DO NOT SEND CHARACTER YET ---
            // We will send the whole buffer only on Enter.
            // The backend will buffer the line based on receiving '\n'.
            // No need to send individual chars here if backend buffers.
          } else {
            console.log(
              `[Client Input ${timestamp}] Unhandled character code: ${code}`
            );
          }
        });
        // ... (rest of initTerminal)
      } catch (error) {
        console.error(
          "[Client Init] Error during terminal initialization:",
          error
        );
        cleanupTerminalResources(); // Clean up if init fails midway
      }
    },
    [terminalConnected, terminalDisconnected, cleanupTerminalResources]
  ); // Add dependencies

  // --- Start Terminal ---
  const handleStartTerminal = async () => {
    // Prevent starting if already active
    if (isActive || xtermRef.current || socketRef.current) {
      console.warn(
        "[Client Start] Terminal is already active or initializing."
      );
      return;
    }
    console.log("[Client Start] Attempting to start terminal...");
    const sid = await startTerminal(projectId); // Calls Redux action
    if (sid) {
      console.log(
        `[Client Start] Received session ID: ${sid}. Initializing terminal UI.`
      );
      initTerminal(sid); // Initialize UI components
    } else {
      console.error(
        "[Client Start] Failed to get session ID from startTerminal action."
      );
      // Handle error (e.g., show alert)
    }
  };

  // --- Terminate Terminal ---
  const handleTerminateTerminal = useCallback(() => {
    console.log("[Client Terminate] Attempting to terminate terminal...");
    // Perform cleanup first
    cleanupTerminalResources();
    // Then call the backend API via Redux action if a session ID exists in state
    if (sessionId) {
      console.log(
        `[Client Terminate] Calling terminateTerminal action for session: ${sessionId}`
      );
      terminateTerminal(sessionId); // Calls Redux action -> API call
    } else {
      console.warn(
        "[Client Terminate] No active session ID found in Redux state to terminate."
      );
    }
  }, [sessionId, terminateTerminal, cleanupTerminalResources]);

  // --- Resize Handling ---
  useEffect(() => {
    const handleResize = () => {
      if (
        fitAddonRef.current &&
        xtermRef.current &&
        socketRef.current &&
        socketRef.current.connected
      ) {
        try {
          fitAddonRef.current.fit();
          const dims = {
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          };
          console.log(
            `[Client Resize] Resized to ${dims.cols}x${dims.rows}. Emitting resize event.`
          );
          socketRef.current.emit("resize", dims);
        } catch (e) {
          console.error("[Client Resize] Error during resize handling:", e);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    // Initial fit after component mounts and terminal might be ready
    setTimeout(handleResize, 150);

    return () => {
      console.log("[Client Cleanup] Removing resize listener.");
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array, relies on refs being current

  // --- Component Unmount Cleanup ---
  useEffect(() => {
    // This effect runs only once on mount and its cleanup runs on unmount
    return () => {
      console.log("[Client Unmount] Component unmounting. Ensuring cleanup.");
      handleTerminateTerminal(); // Ensure termination and cleanup on unmount
    };
  }, [handleTerminateTerminal]); // Depend on the stable terminate handler

  // --- Download File Function (no changes needed) ---
  const downloadFile = async (type) => {
    try {
      // Get the auth token
      const token = localStorage.getItem("token");

      // Create a fetch request with auth headers
      const response = await fetch(
        `/api/files/download/${type}/${project._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `${project.name.replace(/\s+/g, "_")}.${
        type === "zip" ? "zip" : "tex"
      }`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      // You could dispatch an alert action here
      alert(`Download failed: ${error.message}`);
    }
  };

  // --- Render Logic ---
  if (projectLoading || !project) {
    return (
      <div className={classes.root}>
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h4" gutterBottom>
          Project Terminal: {project.name}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Student: {project.student.username} ({project.student.rollNo})
        </Typography>
        <Typography variant="body2" gutterBottom>
          Project Stack: {project.stack.join(", ")}
        </Typography>

        <div className={classes.buttonContainer}>
          <div>
            {/* Ensure button state reflects actual terminal presence */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartTerminal}
              disabled={!!xtermRef.current || loading} // Disable if xterm exists or Redux state is loading
              style={{ marginRight: "8px" }}
            >
              Launch Terminal
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleTerminateTerminal}
              disabled={!xtermRef.current} // Disable if xterm doesn't exist
            >
              Terminate Terminal
            </Button>
          </div>
          <div>
            <Button
              variant="outlined"
              onClick={() => downloadFile("zip")}
              style={{ marginRight: "8px" }}
            >
              Download ZIP
            </Button>
            <Button variant="outlined" onClick={() => downloadFile("latex")}>
              Download LaTeX
            </Button>
          </div>
        </div>

        <Paper className={classes.terminal} ref={terminalRef}>
          {" "}
          {/* Attach ref directly */}
          {/* Conditional rendering based on xtermRef existence might be simpler */}
          {!xtermRef.current &&
            !loading && ( // Show placeholder if not loading and no terminal instance
              <div className={classes.loadingContainer}>
                <Typography variant="body1">
                  Click "Launch Terminal" to start a terminal session
                </Typography>
              </div>
            )}
          {/* The div for xterm is now the Paper itself via the ref */}
        </Paper>

        <Button
          variant="contained"
          onClick={() => history.push("/admin/projects")}
        >
          Back to Projects
        </Button>
      </Paper>
    </div>
  );
};

// --- PropTypes, mapStateToProps, connect (no changes) ---
Terminal.propTypes = {
  auth: PropTypes.object.isRequired,
  terminal: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  startTerminal: PropTypes.func.isRequired,
  terminateTerminal: PropTypes.func.isRequired,
  terminalConnected: PropTypes.func.isRequired,
  terminalDisconnected: PropTypes.func.isRequired,
  getProject: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  terminal: state.terminal,
  project: state.project,
});

export default connect(mapStateToProps, {
  startTerminal,
  terminateTerminal,
  terminalConnected,
  terminalDisconnected,
  getProject,
})(Terminal);
