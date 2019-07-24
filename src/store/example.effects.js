import { getExampleSuccess, getExampleFailure } from './example.store';

export const getExample = (uuid) => async dispatch => {
  try {
    // Do async work here...
    dispatch(getExampleSuccess({projects: {body: {}}}));
  } catch (error) {
    dispatch(getExampleFailure(error));
  }
}
