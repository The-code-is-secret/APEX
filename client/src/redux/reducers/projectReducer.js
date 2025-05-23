import {
  GET_PROJECTS,
  GET_PROJECT,
  ADD_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  PROJECT_ERROR,
  CLEAR_PROJECT
} from '../types';

const initialState = {
  projects: [],
  project: null,
  loading: true,
  pagination: null,
  error: {}
};

function projectReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PROJECTS:
      return {
        ...state,
        projects: payload.data,
        pagination: payload.pagination,
        loading: false
      };
    case GET_PROJECT:
      return {
        ...state,
        project: payload.data,
        loading: false
      };
    case ADD_PROJECT:
      return {
        ...state,
        projects: [payload.data, ...state.projects],
        loading: false
      };
    case UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project =>
          project._id === payload.data._id ? payload.data : project
        ),
        project: payload.data,
        loading: false
      };
    case DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project._id !== payload),
        loading: false
      };
    case PROJECT_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_PROJECT:
      return {
        ...state,
        project: null,
        loading: false
      };
    default:
      return state;
  }
}
export default projectReducer;