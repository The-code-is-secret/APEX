import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_PROJECTS,
  GET_PROJECT,
  ADD_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  PROJECT_ERROR,
  CLEAR_PROJECT
} from '../types';

// Get projects (with pagination and filters)
export const getProjects = (page = 1, limit = 10, status = '') => async dispatch => {
  try {
    let url = `/api/projects?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const res = await axios.get(url);

    dispatch({
      type: GET_PROJECTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Get project by ID
export const getProject = id => async dispatch => {
  try {
    const res = await axios.get(`/api/projects/${id}`);

    dispatch({
      type: GET_PROJECT,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Create a new project
export const addProject = (formData, history) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    const res = await axios.post('/api/projects', formData, config);

    dispatch({
      type: ADD_PROJECT,
      payload: res.data
    });

    dispatch(setAlert('Project Created', 'success'));
    history.push('/student/dashboard');
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    }

    dispatch({
      type: PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Update project
export const updateProject = (id, formData, history) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(`/api/projects/${id}`, formData, config);

    dispatch({
      type: UPDATE_PROJECT,
      payload: res.data
    });

    dispatch(setAlert('Project Updated', 'success'));
    history.push('/student/dashboard');
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    }

    dispatch({
      type: PROJECT_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

// Delete project
export const deleteProject = id => async dispatch => {
  if (window.confirm('Are you sure you want to delete this project? This cannot be undone!')) {
    try {
      await axios.delete(`/api/projects/${id}`);

      dispatch({
        type: DELETE_PROJECT,
        payload: id
      });

      dispatch(setAlert('Project Removed', 'success'));
    } catch (err) {
      dispatch({
        type: PROJECT_ERROR,
        payload: { msg: err.response.statusText, status: err.response.status }
      });
    }
  }
};

// Clear current project
export const clearProject = () => dispatch => {
  dispatch({ type: CLEAR_PROJECT });
};