import axios from 'axios';
import toast from 'react-hot-toast'; // Import toast
import { setAlert } from './alertActions'; // Keep setAlert for other potential errors if needed
import {
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  REGISTER_SUCCESS,
  REGISTER_FAIL
} from '../types';
import setAuthToken from '../../utils/setAuthToken';

// Load User
export const loadUser = () => async dispatch => {
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    const res = await axios.get('/api/auth/me');

    dispatch({
      type: USER_LOADED,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Student Login
export const loginStudent = (rollNo, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ rollNo, password });

  try {
    const res = await axios.post('/api/auth/student/login', body, config);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
    toast.success('Login Successful!'); // Optional: Success toast
    dispatch(loadUser());
  } catch (err) {
    // Extract error message from server response
    const message = err.response?.data?.error || 'Login Failed. Please check your credentials.';
    toast.error(message); // Show error toast

    // Keep original error handling for Redux state if needed
    const errors = err.response?.data?.errors; // Check if 'errors' array exists (might be for validation)
    if (errors && Array.isArray(errors)) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    }

    dispatch({
      type: LOGIN_FAIL
    });
  }
};

// Admin Login
export const loginAdmin = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await axios.post('/api/auth/admin/login', body, config);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
    toast.success('Login Successful!'); // Optional: Success toast
    dispatch(loadUser());
  } catch (err) {
     // Extract error message from server response
     const message = err.response?.data?.error || 'Login Failed. Please check your credentials.';
     toast.error(message); // Show error toast

     // Keep original error handling for Redux state if needed
     const errors = err.response?.data?.errors; // Check if 'errors' array exists
     if (errors && Array.isArray(errors)) {
       errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
     }

    dispatch({
      type: LOGIN_FAIL
    });
  }
};

// Register User
export const register = (formData) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await axios.post('/api/auth/register', formData, config);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    }

    dispatch({
      type: REGISTER_FAIL
    });
  }
};

// Logout
export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
};