import { combineReducers } from 'redux';
import authReducer from './authReducer';
import projectReducer from './projectReducer';
import terminalReducer from './terminalReducer';
import alertReducer from './alertReducer';
import adminReducer from './adminReducer';

export default combineReducers({
  admin: adminReducer,
  auth: authReducer,
  project: projectReducer,
  terminal: terminalReducer,
  alert: alertReducer
});