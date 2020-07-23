import pz from 'pan-zoom';
import EventEmitter from 'eventemitter3';

export default class PanZoom extends EventEmitter {
  constructor(element, {
    minZoom = 0.3,
    maxZoom = 4,
    zoomSpeed = 0.01,
  } = {}) {
    super();

    this.x = 0;
    this.y = 0;
    this.z = 1;
    this.zoomEnabled = true;
    this.panEnabled = true;

    this.zoomSpeed = zoomSpeed;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;

    this.mouse = {x: 0, y: 0};
    this.element = element;

    this.unpz = new pz(this.element, this.onChange.bind(this));

    this.element.style.transformOrigin = '0 0';
    this.mouseMoveHandler = this.onMouseMove.bind(this);
    this.element.addEventListener('mousemove', this.mouseMoveHandler, {passing: true});
  }

  destroy() {
    this.unpz();
    this.element.removeEventListener('mousemove', this.mouseMoveHandler);
  }

  init() { /* noop for backwards compat */ }

  get enabled() {
    return this.panEnabled || this.zoomEnabled;
  }

  enable() {
    this.enablePan();
    this.enableZoom();
  }

  disable() {
    this.disablePan();
    this.disableZoom();
  }

  enablePan() {
    this.panEnabled = true;
  }

  disablePan() {
    this.panEnabled = false;
  }

  enableZoom() {
    this.zoomEenabled = true;
  }

  disableZoom() {
    this.zoomEenabled = false;
  }

  onMouseMove(e) {
    const b = this.element.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    this.mouse = {
      // The mouse position relative to the top left
      // of the scaled size of the element.
      x,
      y,
      // The mouse position to the top left as a percentage.
      px: x / b.width,
      py: y / b.height,
    };
    // console.log(this.mouse);
  }

  onChange({
    dx, // Change in x position (when panning only)
    dy, // Change in y position (when panning only)
    dz, // Change in scale (when mouse or touch zooming only)
    // Panning = Initial x/y of the mouse relative to the top left of the element.
    // Zooming = Initial x/y of the center of the zoom gesture relative to the
    //   top left of the element at time of zoom start.
    // x0,
    // y0
  }) {
    // console.log(
    //   'dx', dx,
    //   'dy', dy,
    //   'dz', dz,
    //   // The unscaled dimensions of the element.
    //   'w', this.element.offsetWidth,
    //   'h', this.element.offsetHeight,
    // );

    // Update the pan position.
    if (this.enablePan) {
      this.x += dx;
      this.y += dy;
    }

    if (this.enableZoom) {
      // Scaled Delta Z
      const sdz = dz * -1 * this.zoomSpeed;

      const lz = this.z;
      this.z = Math.min(
        Math.max(
          this.z + sdz,
          this.minZoom
        ),
        this.maxZoom
      );
      // Delta of the scale value.
      const ds = this.z - lz;

      // If the zoom level has changed at all, shift the x/y position
      // in order to center the zoom around the touch/mouse center point.
      if (ds) {
        // Unscaled width and height.
        const w = this.element.offsetWidth;
        const h = this.element.offsetHeight;

        // Change in w/h since last zoom.
        const cw = w * ds;
        const ch = h * ds;

        // Change in x/y needed to offset scaling around the mouse/touch position.
        const cx = cw * this.mouse.px;
        const cy = ch * this.mouse.py;

        // console.log(
        //   'sdz', sdz,
        //   'ds', ds,
        //   'z',  this.z.toFixed(4),
        //   'w',  w.toFixed(4),
        //   'x',  x.toFixed(4),
        //   'px', this.mouse.px.toFixed(4),
        //   'cw', cw.toFixed(4),
        //   'cx', cx.toFixed(4),
        // );

        // Update the position.
        this.x -= cx;
        this.y -= cy;
      }
    }

    if (this.enabled) {
      this.update();
    }
  }

  update() {
    // Cancel any existing raf
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Schedule a new update
    this.rafId = requestAnimationFrame(() => {
      this.element.style.transform = this.makeTransform(this.x, this.y, this.z);
      this.rafId = null;

      this.emit('change', {
        x: this.x,
        y: this.y,
        scale: this.z,
        width: this.element.offsetWidth,
        height: this.element.offsetHeight,
      });
    });
  }

  makeTransform(x, y, z = 1) {
    return `translate(${x}px, ${y}px) scale(${z})`;
  }

  makeTransformOrigin(x, y) {
    return `${x}px ${y}px`;
  }
}

// NOTES:
// https://stackoverflow.com/questions/2916081/zoom-in-on-a-point-using-scale-and-translate

// from trying to use transform-origin to set the center of transformations
// This doesn't work because the origins is always considered from the original location and scale
// const t = `${(px * 100).toFixed(5)}% ${(py * 100).toFixed(5)}%`;
// // const t = `${this.mouse.px * this.mouse.w}px ${this.mouse.py * this.mouse.h}px`;
// console.log(
//   't', t,
//   'offsetWidth', this.element.offsetWidth,
// );
// this.element.style.transformOrigin = t;

// from the scale change condition
// Nudge x/y
// const nx = x * px;
// const ny = x * px;

// Origin x/y
// const ox = x - this.x // / this.z;
// const oy = y - this.y // / this.z;
// console.log('scale', this.z, 'this.x', this.x, 'x', x0, 'ox', ox);

// this.element.style.transformOrigin = this.makeTransformOrigin(ox, oy);

// console.log(
//   'w', w,
//   'h', h,
//   'z', this.z
// );

// const cx = x * sdz;
// const cy = y * sdz;
// console.log('cx', cx, 'cy', cy);
// this.x -= x * cx;
// this.y -= y * cy;
