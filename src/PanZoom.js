import EventEmitter from 'eventemitter3';
import Hammer from 'hammerjs';
import Wheel from 'wheel';
import { Matrix4, Vector3, Quaternion } from 'three';

import MouseWheel from './MouseWheel';

/**
 * A Pan/Zoom implementation that can zoom any DOM element and
 * constrains panning to the bounds of that element.
 */
export default class PanZoom extends EventEmitter {
  constructor(element, minZoom = 0.5, maxZoom = 3, padding = 0) {
    super();

    this.element = element;
    this.min = minZoom;
    this.max = maxZoom;
    this.padding = padding;
    this.zoom = 1;
    this.zoomSpeed = 0.0005;
    this.position = new Matrix4();

    this.scrollPosition = {
      percent: {x: 0, y: 0},
      bounds: this.element.getBoundingClientRect(),
      zoom: this.zoom,
    };
  }

  init() {
    // TODO Dynamically get the current transform origin and
    // do transformations based on that.
    this.element.style.transformOrigin = "0 0";
    // TODO Take window scroll into account by adding window.scrollX/pageOffsetX
    this.origin = this.element.getBoundingClientRect();

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

  onWheelStart = (e) => {
    const rect = this.element.getBoundingClientRect();

    let offsetX = e.offsetX;
    let offsetY = e.offsetY;
    if (e.target !== this.element) {
      const rect2 = e.target.getBoundingClientRect();
      offsetX = offsetX + (rect2.x - rect.x)/this.zoom;
      offsetY = offsetY + (rect2.y - rect.y)/this.zoom;
    }

    const x = offsetX * this.zoom;
    const y = offsetY * this.zoom;
    const percentX = x / rect.width;
    const percentY = y / rect.height;

    // TODO Is there a better name for this?
    this.scrollPosition = {
      percent: { x: percentX, y: percentY },
      bounds: rect,
      zoom: this.zoom,
    };
  }

  onPinch = (e) => {
    // Determine the zoom level
    let s = this.zoom + e.deltaY * this.zoomSpeed;

    s = Math.min(Math.max(s, this.min), this.max);

    const percentX = this.scrollPosition.percent.x;
    const percentY = this.scrollPosition.percent.y;
    // console.log('%', percentX, percentY, 'dimensions', rect.width, rect.height);
    this.doZoom(s, percentX, percentY);
  }

  doZoomDirect(zoom, x, y) {
    this.scrollPosition.zoom = this.zoom;
    this.scrollPosition.bounds = this.element.getBoundingClientRect();

    this.doZoom(zoom, x, y);
  }

  // TODO Use the event offsetX to set the transform origin
  doZoom(zoom, percentX, percentY) {
    const delta = zoom / this.scrollPosition.zoom;
    this.zoom = zoom;

    // The position of the cursor relative to the
    // top left of the element.
    const rect = this.scrollPosition.bounds;

    const currentX = (this.origin.x - rect.x) * -1;
    const currentY = (this.origin.y - rect.y) * -1;
    // Difference in dimensions as a result of this zoom.
    const diffW = ((rect.width  * delta) - rect.width) ;// / 2;
    const diffH = ((rect.height * delta) - rect.height);// / 2;
    const x = currentX - diffW * percentX;
    const y = currentY - diffH * percentY;

    this.position.makeTranslation(x, y, 0);
    // const change = new Matrix4();
    // change.setPosition(new Vector3(x, y, 0));
    // this.position = change;

    const out = new Matrix4();
    // Move the element left corner to componsate for scaling.
    out.multiply(this.position);
    // Scale the element.
    out.scale(new Vector3(this.zoom, this.zoom, 1));
    // Add the position offset as a result of dragging.
    // out.multiply(this.position);
    // Set the element transform.
    this.setMatrix(out);
  }

  onPanStart = (e) => {
    e.srcEvent.preventDefault();
    e.srcEvent.stopPropagation();
    return false;
  }

  onPanMove = (e) => {
    e.srcEvent.preventDefault();
    e.srcEvent.stopPropagation();

    // TODO This is slightly off.
    // Maybe using absolute positioning to document would be better?
    const x = e.srcEvent.movementX; // / this.zoom;
    const y = e.srcEvent.movementY; // / this.zoom;

    const out = new Matrix4();
    out.scale(new Vector3(this.zoom, this.zoom, 1));

    // debugger;

    this.moveBy(x, y);
    // this.setMatrix(this.position);

    out.premultiply(this.position);
    this.setMatrix(out);
  }

  center() {}
  fill() {}

  // transform(scale, x, y) {
  //   const m = new Matrix4();
  //   m.setPosition(new Vector3(x, y, 0));
  //   m.scale(new Vector3(scale, scale, 1));
  //   this.position.multiply(m);
  //   this.setMatrix(this.position);
  // }

  moveBy(deltaX, deltaY) {
    // console.log('move by', deltaX, deltaY);
    const m = new Matrix4();
    m.setPosition(new Vector3(deltaX, deltaY, 0));
    this.position.multiply(m);
  }

  moveTo(x, y) {
    this.position.setPosition(new Vector3(x, y, 0));
  }

  // TODO Don't modify this.position?
  zoomBy(delta) {
    // Now zoom
    this.position.scale(new Vector3(delta, delta, 1));
  }

  zoomTo() {}

  matrixToString(matrix) {
    return `transform: matrix3d(${matrix.toArray().join(',')})`;
  }


  setMatrix2(matrix, x, y) {
    const m = this.matrixToString(matrix);
    // const style = `transform-origin: ${x}px ${y}px; ${m}`;
    const style = `transform-origin: ${x * 100}% ${y * 100}%; ${m}`;
    // TODO We can set this transform directly without setting the attribute.
    // this.element.style.transform = newMatrix;
    this.element.setAttribute('style', style);
  }

  setMatrix(matrix) {
    const m = this.matrixToString(matrix);
    const style = `transform-origin: 0 0; ${m}`;
    // TODO We can set this transform directly without setting the attribute.
    // this.element.style.transform = newMatrix;
    this.element.setAttribute('style', style);
  }

  getPointFromEvent(e) {
    return {
      x: e.targetTouches ? e.targetTouches[0].clientX : e.clientX,
      y: e.targetTouches ? e.targetTouches[0].clientY : e.clientY,
    };
  }
}
