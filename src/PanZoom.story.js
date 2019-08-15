import { storiesOf } from '@storybook/html';

import './PanZoom.story.css';

import PanZoom from './PanZoom';

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
  setTimeout(() => {
    panZoom.init();
  });

  return test;
}

function testImageExample() {
  const html = `
    <img class="test" src=${testImage} alt="Cat!" />
  `;

  const description = `
    This example shows an &lt;IMG&gt; of a grid. PanZoom is initialized
    with a 50px padding which allows the edges of the image to be
    dragged inside the parent bounding box.
  `;

  const test = createTest('cat-image-example', html, description);
  const root = test.querySelector('.test');

  const panZoom = new PanZoom(root, 1, 2, 50);

  root.addEventListener('load', () => panZoom.init());

  return test;
}

function catImageExample() {
  const html = `
    <img class="test" src=${catImage} alt="Cat!" />
  `;

  const description = `
    This example shows an &lt;IMG&gt; with dimensions that do not
    match those of the parent element. PanZoom is also configured
    with the minimum zoom set to 0.5 so the image can be scaled down.
  `;

  const test = createTest('test-image-example', html, description);
  const root = test.querySelector('.test');

  const panZoom = new PanZoom(root, 0.5);

  root.addEventListener('load', () => panZoom.init());

  return test;
}

const svg = `
  <svg class="test" viewBox="0 0 100 100">
    <rect class="rectangle" x="0" y="0" width="100" height="100"/>
    <circle class="circle" cx="50" cy="50" r="50" />
  </svg>
`;

function svgExample() {
  const description = `
    This example shows a zoomable &lt;SVG&gt; element.
  `;

  const test = createTest('svg-example', svg, description);
  const root = test.querySelector('.test');

  const panZoom = new PanZoom(root);
  setTimeout(() => {
    panZoom.init();
  });

  return test;
}

function svgElementExample() {
  const description = `
    This example shows a zoomable &lt;CIRCLE&gt; element inside an
    SVG. This functionality is currently incomplete.
  `;

  const test = createTest('svg-element-example', svg, description);
  const root = test.querySelector('.circle');

  const panZoom = new PanZoom(root);
  setTimeout(() => {
    panZoom.init();
  });

  return test;
}

function resizeExample() {
  const html = `
    <div class="test">
      <img class="image" id="floorplan" src="${floorplanImage}" />
    </div>
  `;

  const description = `
    This example shows what happens if the zoom container is resized.
  `;

  const test = createTest('resize-example', html, description, 'fill-test');
  const root = test.querySelector('.test');
  const floorplan = test.querySelector('#floorplan');

  const panZoom = new PanZoom(root);
  floorplan.addEventListener('load', () => panZoom.init());

  return test;
}


storiesOf('PanZoom', module)
  .add('Default Div', defaultDivExample)
  .add('Grid Image', testImageExample)
  .add('Cat Image', catImageExample)
  .add('SVG', svgExample)
  .add('SVG Element', svgElementExample)
  .add('Resize', resizeExample)
;
