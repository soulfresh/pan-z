import { storiesOf } from '@storybook/react';
import React from 'react';
import PanZoom from './PanZoom';

import './PanZoom.story.scss';

import testImage from './assets/test-square-200x200.png';
import catImage from './assets/cat.jpg';

class Example extends React.Component {
  constructor(props) {
      super(props);
      this.rootRef = React.createRef();
  }

  get root() {
    return this.rootRef.current;
  }

  initZoom() {
    const panZoom = new PanZoom(this.root);
    panZoom.init();
  }

  componentDidMount() {
    this.root.addEventListener('load', () => this.initZoom());
  }

  render() {
    return (
      <div className="test-container">
        <img className="test" src={catImage} alt="Cat!" ref={this.rootRef} />
        <div className="border"></div>
      </div>
    );
  }
}

class DivExample extends Example {
  componentDidMount() {
    this.initZoom();
    // TODO For some reason zooming on the blue area isn't working.
    // We may need to make sure the wheel events are only executed
    // in the scope of the "zoomable" element because
    // `pointer-events: none` seems to fix it.
  }

  render() {
    return (
      <div className="test-container">
        <div className="test div-example" ref={this.rootRef}>
          <div className="box red"></div>
          <div className="box blue"></div>
        </div>
        <div className="border"></div>
      </div>
    );
  }
}

// TODO SVG examples
// TODO Scrolled page example
storiesOf('PanZoom', module)
  .add('Default', () => <Example />)
  .add('Div', () => <DivExample />)
;
