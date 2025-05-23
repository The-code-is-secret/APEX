import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_ADMIN_PROJECTS,
  ADMIN_PROJECT_ERROR,
  START_TERMINAL,
  TERMINATE_TERMINAL,
  TERMINAL_ERROR,
  CLEAR_TERMINAL
} from '../types';

// Get all projects with stats for admin
export const getAdminProjects = (
  page = 1, 
  limit = 10, 
  status = '', 
  search = ''
) => async dispatch => {
  try {
    let url = `/api/admin/projects?page=${page}&limit=${limit}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    if (search) {
      url += `&search=${search}`;
    }
    
    const res = await axios.get(url);

    dispatch({
      type: GET_ADMIN_PROJECTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ADMIN_PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Review a project
export const reviewProject = (id, formData) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    await axios.put(`/api/admin/projects/${id}/review`, formData, config);

    dispatch(setAlert('Project review submitted', 'success'));
    dispatch(getAdminProjects());
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    }

    dispatch({
      type: ADMIN_PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Start a terminal session
export const startTerminal = projectId => async dispatch => {
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

    dispatch(setAlert('Failed to start terminal session', 'error'));
    return null;
  }
};

// Terminate a terminal session
export const terminateTerminal = sessionId => async dispatch => {
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

// Clear terminal state
export const clearTerminal = () => dispatch => {
  dispatch({
    type: CLEAR_TERMINAL
  });
};