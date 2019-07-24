import { combineReducers } from 'redux';
import { configureStore, createSelector, getDefaultMiddleware } from 'redux-starter-kit';
import { createLogger } from 'redux-logger';
import { flow } from 'lodash';

import exampleReducer, { selectExamples } from './example.store';

const middlewares = [...getDefaultMiddleware()];

if (process.env.NODE_ENV === `development`) {
  middlewares.push(createLogger({
    // See options at:
    // https://www.npmjs.com/package/redux-logger
    collapsed: true
  }));
}

export const reducerConfig = {
  example: exampleReducer
};

const rootReducer = combineReducers(reducerConfig);

export function reset() {
  return {
    type: 'RESET',
    payload: null
  }
}

export default configureStore({
  reducer: (state, action) => {
    if (action.type === 'RESET') {
      // Reset to the initial store state.
      return rootReducer(undefined, action);
    }

    return rootReducer(state, action);
  },
  middleware: middlewares
});

const selectExampleSlice = createSelector(['example']);

// Another potential option for combining selectors:
// https://cmichel.io/redux-selectors-structure
export const selectInputDevices = flow(selectExampleSlice, selectExamples);
