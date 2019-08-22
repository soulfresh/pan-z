export default class PanZoomPageObject {
  constructor(container, element, panzoom) {
    this.container = container;
    this.element = element;
    this.panzoom = panzoom;
  }

  makeMoveEvent(x, y, element) {
    return {
      srcEvent: {
        movementX: x,
        movementY: y,
        target: element,
        preventDefault: () => false,
      }
    };
  }

  makeWheelEvent(x, y, wheelDelta, element) {
    return {
      offsetX: x,
      offsetY: y,
      deltaY: wheelDelta,
      preventDefault: () => false,
      target: element,
    };
  }

  simulatePan(moves) {
    this.panzoom.onPanStart(this.makeMoveEvent(0, 0, this.panzoom.element));
    moves.forEach((m, i) =>
      this.panzoom.onPanMove(this.makeMoveEvent(m.x, m.y, this.panzoom.element))
    );
    this.panzoom.onPanEnd(this.makeMoveEvent(0, 0, this.panzoom.element));
  }

  simulateWheel(x, y, moves) {
    this.panzoom.onWheelStart(this.makeWheelEvent(x, y, 0, this.panzoom.element));
    moves.forEach((m, i) =>
      this.panzoom.onPinch(this.makeWheelEvent(x, y, m.wheel, this.panzoom.element))
    );
    this.panzoom.onWheelStop(this.makeWheelEvent(x, y, 0, this.panzoom.element));
  }

  get width() {
    return this.element.getBoundingClientRect().width;
  }

  get height() {
    return this.element.getBoundingClientRect().height;
  }

  get x() {
    return this.element.getBoundingClientRect().x;
  }

  get y() {
    return this.element.getBoundingClientRect().y;
  }
}
