import { storiesOf } from '@storybook/html';

import './PanZoom.story.css';

import PanZoom from './PanZoom2';
import pz from 'panzoom';

import testImage from './assets/test-square-200x200.png';
import catImage from './assets/cat.jpg';
import floorplanImage from './assets/Harmony Lobby Seoul.jpg';

function createElement(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root.children[0];
}

function createTest(name, test, description, type = 'centered-test') {
  const html = `
    <div class="test-container ${name}">
      <div class="${type}">
        ${test}
        <div class="border"></div>
      </div>
      <p class="description">
        ${description}
      </p>
    </div>
  `;

  return createElement(html);
}

function defaultDivExample() {
  const html = `
    <div class="test">
      <div class="box red"></div>
      <div class="box blue"></div>
      <p class="message">
        I'm a regular old div with text.
      </p>
    </div>
  `;

  const description = `
    This example shows a &lt;DIV&gt; element with text
    and absolutely positioned inner divs. It uses
    the PanZoom default settings.
  `;

  const test = createTest('div-example', html, description);
  const root = test.querySelector('.test');

  const panZoom = new PanZoom(root);

  return test;
}

function libExample() {
  const html = `
    <div class="test">
      <div class="box red"></div>
      <div class="box blue"></div>
      <p class="message">
        I'm a regular old div with text.
      </p>
    </div>
  `;

  const description = `
    https://www.npmjs.com/package/panzoom
  `;

  const test = createTest('div-example', html, description);
  const root = test.querySelector('.test');

  const panZoom = new pz(root, {amplitude: 0.8, minVelocity: 10});

  return test;
}

storiesOf('PanZoom2', module)
  .add('Default Div', defaultDivExample)
  .add('library', libExample)
;
