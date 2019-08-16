import Wheel from 'wheel';

/*
 * Subscribe to wheel event start/update/end events
 * in a cross browser fashion.
 */
export default class MouseWheel {
  constructor() {
    this.startListeners = [];
    this.stopListeners = [];
    this.frequency = 50;
    this.registered = false;

    this.reset();
  }

  get hasListeners() {
    return this.startListeners.length > 0 || this.stopListeners.length > 0;
  }

  reset() {
    this.count = 0;
    this.current = null;
    this.wheeling = false;
  }

  register(element) {
    Wheel.addWheelListener(element, this.onWheel);
    this.registered = true;
  }

  unregister(element) {
    Wheel.removeWheelListener(element, this.onWheel);
    this.registered = false;
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
    this.reset();
    this.wheeling = false;
    this.stopListeners.forEach((l) => l.callback(e));
  }

  addEventListener(name, element, callback) {
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

  removeEventListener(name, element, callback) {
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

  addWheelListener(element, callback) {
    if (!this.registered) {
      this.register(element);
    }
    Wheel.addWheelListener(element, callback);
  }

  removeWheelListener(element, callback) {
    Wheel.removeWheelListener(element, callback);
    if (!this.hasListeners) {
      this.unregister(element);
    }
  }

  addWheelStartListener(element, callback) {
    if (!this.registered) {
      this.register(element);
    }
    this.removeWheelStartListener(element, callback);
    this.startListeners.push({element, callback});
  }

  removeWheelStartListener(element, callback) {
    this.startListeners = this.startListeners.filter((c) =>
      callback
        ? c.element !== element || c.callback !== callback
        : c.element !== element
    );
    if (!this.hasListeners) {
      this.unregister(element);
    }
  }

  addWheelStopListener(element, callback) {
    if (!this.registered) {
      this.register(element);
    }
    this.removeWheelStopListener(element, callback);
    this.stopListeners.push({element, callback});
  }

  removeWheelStopListener(element, callback) {
    this.stopListeners = this.stopListeners.filter((c) =>
      callback
        ? c.element !== element || c.callback !== callback
        : c.element !== element
    );
    if (!this.hasListeners) {
      this.unregister(element);
    }
  }
}
