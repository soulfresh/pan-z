import { createSlice, createSelector } from 'redux-starter-kit';

// Simplified mechanism for creating a Reducer and its
// associated Actions.
// @see https://redux-starter-kit.js.org/usage/usage-guide#creating-slices-of-state
const ExampleSlice = createSlice({
  initialState: {
    initialized: false,
    notices: [],
    examples: []
  },
  reducers: {
    getExampleSuccess(draftState, action) {
      // Under the hood, this uses the Immer library, allowing you
      // to mutate the state directly because we are receiving a
      // draft version of the state here. You MUST mutate the `draftState`
      // given to you; you CANNOT return a new state object.
      draftState.initialized = true;
      draftState.examples = action.payload;
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
const { actions, reducer } = ExampleSlice;

// Extract and export each action creator by name
export const { getExampleSuccess, getExampleFailure } = actions;

// Export the reducer
export default reducer;

export const selectExamples = createSelector(['examples']);
