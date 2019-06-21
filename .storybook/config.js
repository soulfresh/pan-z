import { configure } from '@storybook/react';

import '../src/storybook-index.scss';

function loadStories() {
  require('../src');
}

configure(loadStories, module);
