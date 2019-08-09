import { configure } from '@storybook/html';

import '../src/storybook-index.css';

const req = require.context('../src', true, /\.story\.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
