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

  addWheelListener(element, callback) {
    this.reset();
    // TODO Verify that callback gets called after our handler.
    Wheel.addWheelListener(element, this.onWheel);
    Wheel.addWheelListener(element, callback);
  }

  removeWheelListener(/*element, callback*/) {}

  addWheelStartListener(element, callback) {
    this.startListeners = this.startListeners.filter((c) =>
      c.element !== element || c.callback !== callback
    );

    this.startListeners.push({element, callback});
  }

  removeWheelStartListener(/*element, callback*/) { }

  addWheelStopListener(element, callback) {
    this.stopListeners = this.stopListeners.filter((c) =>
      c.element !== element || c.callback !== callback
    );

    this.stopListeners.push({element, callback});
  }

  removeWheelStopListener(/*element, callback*/) { }

  removeAllWheelListeners(/*element*/) { }
}
