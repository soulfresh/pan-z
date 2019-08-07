import { configure } from '@storybook/react';

import '../src/storybook-index.scss';

const req = require.context('../src', true, /.story.js$/);

function loadStories() {
    req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
