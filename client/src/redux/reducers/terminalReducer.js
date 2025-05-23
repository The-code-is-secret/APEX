import {
  START_TERMINAL,
  TERMINATE_TERMINAL,
  TERMINAL_ERROR,
  TERMINAL_CONNECTED,
  TERMINAL_DISCONNECTED
} from '../types';

const initialState = {
  sessionId: null,
  isActive: false,
  isConnected: false,
  loading: false,
  error: null
};

function terminalReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case START_TERMINAL:
      return {
        ...state,
        sessionId: payload.sessionId,
        isActive: true,
        loading: false
      };
    case TERMINAL_CONNECTED:
      return {
        ...state,
        isConnected: true,
        loading: false
      };
    case TERMINAL_DISCONNECTED:
    case TERMINATE_TERMINAL:
      return {
        ...state,
        sessionId: null,
        isActive: false,
        isConnected: false,
        loading: false
      };
    case TERMINAL_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
}
export default terminalReducer;