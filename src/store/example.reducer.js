import { createAction, createSlice } from 'redux-starter-kit';

export const getExampleSuccess = createAction("getExampleSuccess");
export const getExampleFailure = createAction("getExampleFailure");

export const getExample = (uuid) => async dispatch => {
  try {
    // TODO Do async work here...
    dispatch(getExampleSuccess({projects: {body: {}}}));
  } catch (error) {
    dispatch(getExampleFailure(error));
  }
}

// Simplified mechanism for creating a Reducer and its
// associated Actions.
// @see https://redux-starter-kit.js.org/usage/usage-guide#creating-slices-of-state
const ExampleSlice = createSlice({
  initialState: {
    initialized: false,
    notices: [],
    projects: []
  },
  reducers: {
    getExampleSuccess(draftState, action) {
      // Under the hood, this uses the Immer library, allowing you
      // to mutate the state directly because we are receiving a
      // draft version of the state here. You MUST mutate the `draftState`
      // given to you; you CANNOT return a new state object.
      draftState.initialized = true;
      draftState.data = action.payload.projects.body;
    },
    getExampleFailure(draftState, action) {
      // console.log('getExample FAIL reducer', action);
      draftState.initialized = true;
      // TODO Check for userMessage properties and if not defined, set them.
      draftState.notices = action.payload;
    }
  }
});

// Extract the action creators object and the reducer
const { /*actions,*/ reducer } = ExampleSlice;

// Extract and export each action creator by name
// export const { actionNameHere } = actions

// Export the reducer
export default reducer;

export const select = {
  initialized(state) {
    return state.initialized;
  },

  notices(state) {
    return state.notices;
  },

  projects(state) {
    return state.projects;
  }
};
