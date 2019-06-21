import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

describe('App', function() {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    ReactDOM.render(<App />, root);
  });

  afterEach(function() {
    ReactDOM.unmountComponentAtNode(root);
  });

  it('renders without crashing', () => {
    expect(true).toBe(true);
  });
});
