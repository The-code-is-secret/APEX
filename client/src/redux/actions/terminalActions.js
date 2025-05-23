import axios from 'axios';
import { setAlert } from './alertActions';
import {
  START_TERMINAL,
  TERMINATE_TERMINAL,
  TERMINAL_ERROR,
  TERMINAL_CONNECTED,
  TERMINAL_DISCONNECTED
} from '../types';

// Start terminal session
export const startTerminal = (projectId) => async dispatch => {
  try {
    const res = await axios.post(`/api/admin/terminal/${projectId}/start`);

    dispatch({
      type: START_TERMINAL,
      payload: res.data.data
    });

    dispatch(setAlert('Terminal session started', 'success'));
    return res.data.data.sessionId;
  } catch (err) {
    dispatch({
      type: TERMINAL_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
    dispatch(setAlert('Failed to start terminal', 'error'));
    return null;
  }
};

// Terminate terminal session
export const terminateTerminal = (sessionId) => async dispatch => {
  try {
    await axios.post(`/api/admin/terminal/${sessionId}/terminate`);

    dispatch({
      type: TERMINATE_TERMINAL
    });

    dispatch(setAlert('Terminal session terminated', 'success'));
  } catch (err) {
    dispatch({
      type: TERMINAL_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Terminal connected
export const terminalConnected = () => dispatch => {
  dispatch({
    type: TERMINAL_CONNECTED
  });
};

// Terminal disconnected
export const terminalDisconnected = () => dispatch => {
  dispatch({
    type: TERMINAL_DISCONNECTED
  });
};