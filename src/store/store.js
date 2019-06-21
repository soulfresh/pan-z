import { combineReducers } from 'redux';
import { configureStore } from 'redux-starter-kit';
import exampleReducer from './example.reducer';

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
  }
});
