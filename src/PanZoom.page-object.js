export default class PanZoomPageObject {
  constructor(container, element) {
    this.container = container;
    this.element = element;
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
