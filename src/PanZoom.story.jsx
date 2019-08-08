import React from 'react';
import { storiesOf } from '@storybook/react';
// import withCode from 'storybook-addon-code';

// const styleFile = require('./PanZoom.story.scss');
// const codeFile  = require('./PanZoom.story.jsx');

import {
  Example,
  TestImageExample,
  CatExample,
  SVGExample,
  SVGElementExample,
} from './PanZoomExamples.jsx';
import './PanZoom.story.scss';

// TODO Scrolled page example
storiesOf('PanZoom', module)
  // .addDecorator(withCode(codeFile, 'javascript'))
  // .addDecorator(withCode(styleFile, 'sass'))
  .add('Default Div', () => <Example />)
  .add('Image', () => <TestImageExample />)
  .add('Cat', () => <CatExample />)
  .add('SVG', () => <SVGExample />)
  .add('SVG Element', () => <SVGElementExample />)
;
