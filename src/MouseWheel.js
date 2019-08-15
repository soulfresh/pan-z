import Wheel from 'wheel';

export default class MouseWheel {
  constructor() {
    this.startListeners = [];
    this.stopListeners = [];
    this.frequency = 50;

    this.reset();
  }

  reset() {
    this.count = 0;
    this.current = null;
    this.wheeling = false;
  }

  onWheel = (e) => {
    ++this.count;

    if (!this.wheeling && this.startListeners) {
      this.start(e);
    }

    this.current = this.count;

    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.count === this.current && this.wheeling) {
        this.end(e);
      }
    }, this.frequency);
  }

  start(e) {
    this.wheeling = true;
    this.startListeners.forEach((l) => l.callback(e));
  }

  end(e) {
    this.wheeling = false;
    this.stopListeners.forEach((l) => l.callback(e));
  }

  addListener(name, element, callback) {
    switch(name) {
    case 'start':
      this.addWheelStartListener(element, callback);
      break;
    case 'end':
      this.addWheelStopListener(element, callback);
      break;
    default:
      this.addWheelListener(element, callback);
    }
  }

  removeListener(name, element, callback) {
    switch(name) {
    case 'start':
      this.removeWheelStartListener(element, callback);
      break;
    case 'end':
      this.removeWheelStopListener(element, callback);
      break;
    default:
      this.removeWheelListener(element, callback);
    }
  }

  // TODO Testing for all of this stuff.
  addWheelListener(element, callback) {
    this.reset();
    Wheel.addWheelListener(element, this.onWheel);
    Wheel.addWheelListener(element, callback);
  }

  removeWheelListener(element, callback) {
    Wheel.removeWheelListener(element, this.onWheel);
    Wheel.removeWheelListener(element, callback);
  }

  addWheelStartListener(element, callback) {
    this.removeWheelStartListener(element, callback);
    this.startListeners.push({element, callback});
  }

  removeWheelStartListener(element, callback) {
    this.startListeners = this.startListeners.filter((c) =>
      callback
        ? c.element !== element || c.callback !== callback
        : c.element !== element
    );
  }

  addWheelStopListener(element, callback) {
    this.removeWheelStopListener(element, callback);
    this.stopListeners.push({element, callback});
  }

  removeWheelStopListener(element, callback) {
    this.stopListeners = this.stopListeners.filter((c) =>
      callback
        ? c.element !== element || c.callback !== callback
        : c.element !== element
    );
  }
}
