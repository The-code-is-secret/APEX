import {
  GET_ADMIN_PROJECTS,
  ADMIN_PROJECT_ERROR,
  START_TERMINAL,
  TERMINATE_TERMINAL,
  TERMINAL_ERROR,
  CLEAR_TERMINAL
} from '../types';

const initialState = {
  projects: [],
  stats: null,
  pagination: null,
  loading: true,
  error: null,
  terminal: {
    sessionId: null,
    isActive: false,
    error: null
  }
};

function adminReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_ADMIN_PROJECTS:
      return {
        ...state,
        projects: payload.data,
        stats: payload.stats,
        pagination: payload.pagination,
        loading: false
      };
    case ADMIN_PROJECT_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case START_TERMINAL:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          sessionId: payload.sessionId,
          isActive: true,
          error: null
        }
      };
    case TERMINATE_TERMINAL:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          sessionId: null,
          isActive: false
        }
      };
    case TERMINAL_ERROR:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          error: payload
        }
      };
    case CLEAR_TERMINAL:
      return {
        ...state,
        terminal: {
          sessionId: null,
          isActive: false,
          error: null
        }
      };
    default:
      return state;
  }
}
export default adminReducer;