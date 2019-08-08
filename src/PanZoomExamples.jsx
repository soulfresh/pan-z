import React from 'react';
import PanZoom from './PanZoom';

import testImage from './assets/test-square-200x200.png';
import catImage from './assets/cat.jpg';
import { ReactComponent as SVGImage } from './assets/circle-square.svg';

export class Example extends React.Component {
  constructor(props) {
      super(props);
      this.rootRef = React.createRef();
  }

  get root() {
    return this.rootRef.current;
  }

  initZoom(min = 1, max = 3, padding = 0) {
    const panZoom = new PanZoom(this.root, min, max, padding);
    panZoom.init();
  }

  componentDidMount() {
    this.initZoom();
  }

  render() {
    return (
      <div className="test-container">
        <div className="test div-example" ref={this.rootRef}>
          <div className="box red"></div>
          <div className="box blue"></div>
          <p className="message">
            I'm a regular old div with text.
          </p>
        </div>
        <div className="border"></div>
        <p className="description">
          This example shows a &lt;DIV&gt; element with text
          and absolutely positioned inner divs. It uses
          the PanZoom default settings.
        </p>
      </div>
    );
  }
}

export class TestImageExample extends Example {
  componentDidMount() {
    this.root.addEventListener('load', () => this.initZoom(1, 2, 50));
  }

  render() {
    return (
      <div className="test-container test-image-example">
        <img className="test" src={testImage} alt="Cat!" ref={this.rootRef} />
        <div className="border"></div>
        <p className="description">
          This example shows an &lt;IMG&gt; of a grid. PanZoom is initialized
          with a 50px padding which allows the edges of the image to be
          dragged inside the parent bounding box.
        </p>
      </div>
    );
  }
}

export class CatExample extends Example {
  componentDidMount() {
    this.root.addEventListener('load', () => this.initZoom(0.5));
  }

  render() {
    return (
      <div className="test-container cat-image-example">
        <img className="test" src={catImage} alt="Cat!" ref={this.rootRef} />
        <div className="border"></div>
        <p className="description">
          This example shows an &lt;IMG&gt; with dimensions that do not
          match those of the parent element. PanZoom is also configured
          with the minimum zoom set to 0.5 so the image can be scaled down.
        </p>
      </div>
    );
  }
}

export class SVGExample extends Example {
  componentDidMount() {
    this.initZoom(undefined, undefined, '10 20 30 40');
  }

  render() {
    return (
      <div className="test-container">
        <SVGImage className="test svg-example" ref={this.rootRef} />
        <div className="border"></div>
        <p className="description">
          This example shows an &lt;SVG&gt; element as the target
          for the PanZoom. PanZoom is configured with different
          padding values for each of edge of the parent bounds.
        </p>
      </div>
    );
  }
}

export class SVGElementExample extends Example {
  render() {
    return (
      <div className="test-container">
        <svg className="test svg-example" viewBox="0 0 100 100">
          <rect className="rectangle" x="0" y="0" width="100" height="100"/>
          <circle className="circle" cx="50" cy="50" r="50" ref={this.rootRef} />
        </svg>
        <div className="border"></div>
        <p className="description">
          This example shows a zoomable &lt;CIRCLE&gt; element inside an
          SVG. This functionality is currently incomplete.
        </p>
      </div>
    );
  }
}

