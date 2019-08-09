import EventEmitter from 'eventemitter3';
import Hammer from 'hammerjs';
import { Matrix4, Vector3 } from 'three';

import Matrix from './Matrix';
import MouseWheel from './MouseWheel';

/**
 * A Pan/Zoom implementation that can zoom any DOM element and
 * constrains panning to the bounds of that element.
 *
 * More PanZoom Libraries:
 * - https://github.com/dy/pan-zoom
 * - https://github.com/timmywil/panzoom
 * - https://www.npmjs.com/package/jquery.panzoom
 *
 * Matrix Pan Zoom Docs/Tutorials:
 * - http://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/
 */
export default class PanZoom extends EventEmitter {
  constructor(element, minZoom = 1, maxZoom = 3, padding = 0) {
    super();

    this.element = element;
    this.min = minZoom;
    this.max = maxZoom;
    this.scale = 1;
    this.speed = 0.0005;
    this.position = new Matrix();

    this.setPadding(padding);

    this.transformStartValues = {
      percent: {x: 0, y: 0},
      bounds: this.element.getBoundingClientRect(),
      zoom: this.scale,
    };
  }

  /*
   * Set the padding used during clamp calculations. This
   * subtracts padding from the parent element bounds, allowing
   * the edges of the panned element to be panned inside the parent
   * bounds. In other words, the edges of the panned element
   * can be moved inside the parent element by the padding amount.
   *
   * @param padding {boolean | number | string | object}
   *   If false is passed, no clamping occurs.
   *   If a number is passed, that number is used as the padding
   *     on all sides of the parent element bounds.
   *   If a string is passed, this is interpreted as a CSS padding
   *     string without the number format (ie. don't use 'px' or '%').
   *     Ex. '10 20 30 40' = {top: 10, right: 20, bottom: 30, left: 40}.
   *   If a object is passed, it should be of the format
   *     {top: 0, right: 0, bottom: 0, left: 0}
   */
  setPadding(padding) {
    if (padding === false) {
      this.padding = false;
    } else if (typeof padding === 'number') {
      this.padding = {
        left   : padding,
        right  : padding,
        top    : padding,
        bottom : padding,
      };
    } else if (typeof padding === 'object') {
      this.padding = {
        left   : padding.left   ? padding.left    : 0,
        right  : padding.right  ? padding.right   : 0,
        top    : padding.top    ? padding.top     : 0,
        bottom : padding.bottom ? padding.bottom  : 0,
      };
    } else if (typeof padding === 'string') {
      const parts = padding.split(' ');
      this.padding = {
        top    : parts[0] ? Number(parts[0]) : 0,
        right  : parts.length > 1 ? Number(parts[1]) : Number(parts[0]),
        bottom : parts.length > 2 ? Number(parts[2]) : Number(parts[0]),
        left   : parts.length > 3
          ? Number(parts[3])
          : parts.length > 1
            ? Number(parts[1])
            : Number(parts[0]),
      };
    } else {
      this.padding = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
    }
  }

  /*
   * This must be called when you are ready to start the pan/zoom
   * functionality. It's important that this occurs after your
   * element layout is complete so that measurements of the DOM
   * nodes is accurate. Calling this will also attach the necessary
   * DOM event listeners.
   */
  init() {
    // TODO Take window scroll into account by adding window.scrollX/pageOffsetX
    this.origin = this.element.getBoundingClientRect();
    this.bounds = this.element.parentElement.getBoundingClientRect();

    // Wheel.addWheelListener(this.element, this.onPinch);
    this.wheel = new MouseWheel();
    this.wheel.addWheelStartListener(this.element, this.onWheelStart);
    this.wheel.addWheelListener(this.element, this.onPinch);

    this.hammer = new Hammer.Manager(this.element, {});

    this.hammer.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
    // this.hammer.add( new Hammer.Tap({ event: 'doubletap', taps: 2, posThreshold: 20 }) );
    // this.hammer.add( new Hammer.Pinch() )
    //   .recognizeWith(this.hammer.get('pan'));

    this.hammer.on('panstart', this.onPanStart);
    this.hammer.on('panmove', this.onPanMove);
    // this.hammer.on('doubletap', this.onDoubleTap);
    // this.hammer.on('pinchstart', this.onPinchStart);
    // this.hammer.on('pinchmove', this.onPinch);
  }

  // TODO Complete these.
  destroy() {}
  resize() {}

  /*
   * Programatically set the zoom level.
   * @param zoom {number} The scale value. This value is not clamped (use
   *   clampScale and clampPosition if you want clamping). 2 = twice the
   *   original size. 1 = the original size. 0.5 = half the original size.
   * @param percentX {number} The x center point around which you want to
   *   zoom. This should be a value between 0 and 1.
   * @param percentY {number} The y center point around which you want to
   *   zoom (between 0-1).
   */
  zoom(zoom, percentX, percentY) {
    this.transformStartValues.zoom = this.scale;
    this.transformStartValues.bounds = this.element.getBoundingClientRect();

    this._doZoom(zoom, this.clampPercent(percentX), this.clampPercent(percentY));
  }

  /*
   * Programatically set the pan position.
   * @param x {number} The new x location. This value is not clamped (use
   *   clampPosition if you want clamping).
   * @param y {number} The new y location. This value is not clamped (use
   *   clampPosition if you want clamping).
   */
  pan(x, y) {
    this.transformStartValues.bounds = this.element.getBoundingClientRect();
    this._doPan(x, y);
  }

  /*
   * Center the element within it's parent's bounds.
   */
  center() {
    const rect = this.element.getBoundingClientRect();
    const x = ((rect.width - this.bounds.width) / 2) * -1;
    const y = ((rect.height - this.bounds.height) / 2) * -1;
    this.pan(x, y);
  }

  /*
   * Reset the element scale and position to it's origin.
   */
  reset() {
    this.zoom(1, 0, 0);
    this.pan(0, 0);
  }

  /*
   * Clamp 0 - 1
   */
  clampPercent(p) {
    return Math.min(Math.max(p, 0), 1);
  }

  /*
   * Clamp between the min and max zoom level.
   */
  clampScale(s) {
    return Math.min(Math.max(s, this.min), this.max);
  }

  /*
   * Clamp the element location within it's parent's bounding box.
   */
  clampPosition(x, y, width, height) {
    if (this.padding === false) {
      return {x, y};
    }

    const b = {
      left: this.padding.left,
      right: this.bounds.width - width - this.padding.right,
      top: this.padding.top,
      bottom: this.bounds.height - height - this.padding.bottom,
      width: this.bounds.width - this.padding.left - this.padding.right,
      height: this.bounds.height - this.padding.top - this.padding.bottom,
    };
    let clampedX = 0;
    let clampedY = 0;

    if (width > b.width) {
      clampedX = Math.max(Math.min(x, b.left), b.right);
    } else if (width < b.width) {
      clampedX = Math.min(Math.max(x, b.left), b.right);
    }

    if (height > b.height) {
      clampedY = Math.max(Math.min(y, b.top), b.bottom);
    } else if (height < b.height) {
      clampedY = Math.min(Math.max(y, b.top), b.bottom);
    }

    return {x: clampedX, y: clampedY};
  }

  _doZoom(zoom, percentX, percentY) {
    // Calculate the change in scale.
    const delta = zoom / this.transformStartValues.zoom;

    // Store the new scale setting.
    this.scale = zoom;

    // The position of the cursor relative to the
    // top left of the element at zoom start.
    // This helps avoid the element from wandering due to
    // small changes in the position calculations as the
    // scale changes.
    const rect = this.transformStartValues.bounds;

    // The current position relative to the origin.
    const currentX = (this.origin.x - rect.x) * -1;
    const currentY = (this.origin.y - rect.y) * -1;
    // Difference in dimensions as a result of this.scale.
    const diffW = ((rect.width  * delta) - rect.width);
    const diffH = ((rect.height * delta) - rect.height);
    // The new position after zoom.
    const x = currentX - diffW * percentX;
    const y = currentY - diffH * percentY;

    const w = rect.width + diffW;
    const h = rect.height + diffH;

    const p = this.clampPosition(x, y, w, h);

    // Reset the pan position to the position we just calculated.
    this.position.makeTranslation(p.x, p.y, 0);
    // Generate the new transform matrix.
    const out = new Matrix();
    // Move the element top left corner to componsate for scaling.
    out.multiply(this.position);
    // Scale the element.
    out.scale(new Vector3(zoom, zoom, 1));
    // Set the element transform.
    this.setMatrix(out);
  }

  _doPan(x, y) {
    // TODO If this.element is an SVG element, we need
    // to translate between SVG and Screen units.
    // Update the position by the change in x/y.
    this.position.setPosition(new Vector3(x, y, 0));

    // Generate a new transform matrix.
    const out = new Matrix();
    // Add the position new position.
    out.multiply(this.position);
    // Set the current scale.
    out.scale(new Vector3(this.scale, this.scale, 1));
    // Set the element transform.
    this.setMatrix(out);
  }

  onWheelStart = (e) => {
    const rect = this.element.getBoundingClientRect();

    let offsetX = e.offsetX;
    let offsetY = e.offsetY;
    if (e.target !== this.element) {
      const rect2 = e.target.getBoundingClientRect();
      offsetX = offsetX + (rect2.x - rect.x)/this.scale;
      offsetY = offsetY + (rect2.y - rect.y)/this.scale;
    }

    const x = offsetX * this.scale;
    const y = offsetY * this.scale;
    const percentX = x / rect.width;
    const percentY = y / rect.height;

    this.transformStartValues = {
      percent: { x: percentX, y: percentY },
      bounds: rect,
      zoom: this.scale,
    };
  }

  onPinch = (e) => {
    // Determine the zoom level
    let s = this.scale + e.deltaY * this.speed;

    // Keep it in our bounds.
    s = this.clampScale(s);

    const percentX = this.transformStartValues.percent.x;
    const percentY = this.transformStartValues.percent.y;
    this._doZoom(s, percentX, percentY);
  }

  onPanStart = (e) => {
    // Prevent native drag events such as image drag/drop.
    e.srcEvent.preventDefault();
    e.srcEvent.stopPropagation();

    this.transformStartValues.bounds = this.element.getBoundingClientRect();

    return false;
  }

  onPanMove = (e) => {
    // Prevent native drag events such as image drag/drop.
    e.srcEvent.preventDefault();
    e.srcEvent.stopPropagation();

    // Get the change in position.
    const deltaX = e.srcEvent.movementX;
    const deltaY = e.srcEvent.movementY;

    // Add that delta to our current position.
    const m = new Matrix();
    m.makeTranslation(deltaX, deltaY, 0);
    m.premultiply(this.position);

    const b = this.transformStartValues.bounds;

    const position = this.clampPosition(m.x, m.y, b.width, b.height);

    this._doPan(position.x, position.y);
  }

  matrixToString(matrix) {
    return `transform: matrix3d(${matrix.toArray().join(',')})`;
  }

  setMatrix(matrix) {
    const m = this.matrixToString(matrix);
    const style = `transform-origin: 0 0; ${m}`;
    this.element.setAttribute('style', style);
  }
}
