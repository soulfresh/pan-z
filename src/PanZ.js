import pz from '@thesoulfresh/pan-zoom';
import EventEmitter from 'eventemitter3';
import debounce from 'lodash.debounce';
import { fitAndPosition } from 'object-fit-math';
import ResizeObserver from 'resize-observer-polyfill';

// Base class to keep non-pan-zoom related
// functionality out of PanZ.
class Base extends EventEmitter {
  constructor(debug = false) {
    super();

    // Setup configurable logging.
    const bound = level => console[level].bind(window.console, '[PanZ]');
    const noop = () => {};
    ['debug', 'log', 'info'].forEach(level => {
      this[level] = debug ? bound(level) : noop;
    });

    // Always log the following...
    this.error = bound('error');
    this.warn = bound('warn');
  }
}


// TODO Bounds setting where the element has to be inside bounding element
// if smaller or has to touch the edges if larger.
export default class PanZ extends Base {
  constructor(
    {
      minZoom = 0.3,
      maxZoom = 4,
      zoomSpeed = 1,
      zoomEnabled = true,
      panEnabled = true,
      bounds = 0.8,
      boundingElement,
      gestureTimeout = 60,
      initialFit = null,
    } = {},
    element,
    verbose
  ) {
    super(verbose);

    this.log('created with', arguments);

    this._x = 0;
    this._y = 0;
    // Element scale value.
    this._z = 1;
    // The focus point of movement.
    this._cx = 0;
    this._cy = 0;
    this.boundingType = 0;
    this._moving = false;

    this.onResize = debounce(this.onResize.bind(this), 300);
    this.onGestureStart = this.onGestureStart.bind(this);
    this.onGestureChange = this.onGestureChange.bind(this);
    this.onGestureEnd = this.onGestureEnd.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);

    this.bounds = bounds;
    this.boundingElement = boundingElement;
    this._zoomEnabled = zoomEnabled;
    this._panEnabled = panEnabled;
    this._zoomSpeed = zoomSpeed / 100;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.initialFit = initialFit;
    this.gestureTimeout = gestureTimeout;

    if (element) this.init(element, {});
  }

  init(element, options) {
    this.destroy();

    this.element = element;

    // Apply any options the user wants to update.
    if (options) {
      for (let key in options)
        this[key] = options[key];
    }

    // Initialize the pan zoom tracker.
    this._initPanZoom();

    // Setup the necessary transform settings and warn the
    // user if we are going to change their settings.
    this._setTransformOrigin();
    this._setSelectionProperties();
    this._testTransform();

    // If a bounding element wasn't set, the use the element itself.
    if (!this.boundingElement) this.boundingElement = element;

    this._resizeObserver = new ResizeObserver(this.onResize);
    this._resizeObserver.observe(this.boundingElement);

    this.info('initialized with', arguments);
    this.debug('settings:', this);

    if (this.initialFit === 'center') this.center(false, true);
    else if (this.initialFit === 'contain') this.contain(false, true);
    else if (this.initialFit === 'cover') this.cover(false, true);

    this._initialized = true;
  }

  destroy() {
    if (this.element) {
      // Cancel debounced functions.
      if (this.onResize.cancel) this.onResize.cancel();

      // Destroy pan/zoom functionality.
      this._destroyPanZoom();

      // Remove resize observer.
      this._resizeObserver.disconnect();

      // Remove listeners to this object.
      this.removeAllListeners();

      // Clean up DOM references
      this.element = null;
      this.boundingElement = null;
      this._initialized = false;

      this.info('destroyed');
    }
  }

  _initPanZoom() {
    if (!this.unpz && this.element && this.enabled) {
      // TODO Configure pan friction and clamp animation to match zoomSpeed
      this.unpz = new pz(
        this.element,
        this.onGestureChange,
        {
          onStart: this.onGestureStart,
          onEnd: this.onGestureEnd,
          onDoubleTap: this.onDoubleClick,
        }
      );

      this._moving = false;

      // TODO Verify this
      if (!this._panEnabled) this.disablePan();
      if (!this._zoomEnabled) this.disableZoom();
    }
  }

  _destroyPanZoom() {
    if (this.unpz) {
      this.unpz();
      this.unpz = null;
      this._moving = false;
    }
  }

  get scale() {
    return this._z;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get moving() {
    return this._moving;
  }

  get initialized() {
    return this._initialized;
  }

  get enabled() {
    return this._panEnabled || this._zoomEnabled;
  }

  get panEnabled() {
    return this._panEnabled;
  }

  get zoomEnabled() {
    return this._zoomEnabled;
  }

  get position() {
    return {
      x: this._x,
      y: this._y,
      z: this._z,
    };
  }

  get elementWidth() {
    // offsetWidth is not defined for SVG elements, so use clientWidth as a fallback.
    return this.element.offsetWidth || this.element.clientWidth;
  }

  get elementHeight() {
    // offsetHeight is not defined for SVG elements, so use clientHeight as a fallback.
    return this.element.offsetHeight || this.element.clientHeight;
  }

  get boundingWidth() {
    // offsetWidth is not defined for SVG elements, so use clientWidth as a fallback.
    return this.boundingElement.offsetWidth || this.boundingElement.clientWidth;
  }

  get boundingHeight() {
    // offsetHeight is not defined for SVG elements, so use clientHeight as a fallback.
    return this.boundingElement.offsetHeight || this.boundingElement.clientHeight;
  }

  enable() {
    this.enablePan();
    this.enableZoom();
    this._initPanZoom();
  }

  disable() {
    this.disablePan();
    this.disableZoom();
    this._destroyPanZoom();
  }

  enablePan() {
    this._panEnabled = true;
    this.unpz.enablePan();
    this.info('pan enabled');
  }

  disablePan() {
    this._panEnabled = false;
    this.unpz.disablePan();
    // Disabling pan-zoom will stop all events an we will
    // nolonger recieve the gesture end event, so we need
    // to clean up the moving state here.
    this._moving = false;

    this.info('pan disabled');
  }

  enableZoom() {
    this._zoomEnabled = true;
    this.unpz.enableZoom();
    this.info('zoom enabled');
  }

  disableZoom() {
    this._zoomEnabled = false;
    this.unpz.disableZoom();
    // Disabling pan-zoom will stop all events an we will
    // nolonger recieve the gesture end event, so we need
    // to clean up the moving state here.
    this._moving = false;

    this.info('zoom disabled');
  }

  reset(clamp, animated) {
    this._emitState('start');
    this._setState(0, 0, 1, clamp, animated);
  }

  center(animated, immediate) {
    this._emitState('start');
    const t = this._percentToTranslation(0.5, 0.5);
    this._setState(t.x, t.y, this._z, false, animated, immediate);
  }

  contain(animated, immediate) {
    this._fitToBounds('contain', false, animated, immediate);
  }

  cover(animated, immediate) {
    this._fitToBounds('cover', false, animated, immediate);
  }

  scaleDown(animated, immediate) {
    this._fitToBounds('scale-down', false, animated, immediate);
  }

  panTo(px, py, clamp, animated) {
    this._emitState('start');
    const t = this._percentToTranslation(px, py);
    this._setState(t.x, t.y, this._z, clamp, animated);
  }

  zoomTo(z = 1, cpx = 0.5, cpy = 0.5, clamp, animated) {
    this._emitState('start');
    const nz = this._scaleToScaleDelta(z);
    // TODO Use _setState instead?
    this.zoomBy(nz, cpx, cpy, clamp, animated);
  }

  centerOn(px = 0.5, py = 0.5, z = this._z, clamp, animated) {
    this._emitState('start');
    const t = this._percentToTranslation(px, py);

    // const dz = this._scaleToScaleDelta(z);
    const dz = z - this._z;
    const p = this._getPositionAdjustedForScale(dz, px, py);

    const x = t.x + p.x;
    const y = t.y + p.y;

    this._setState(x, y, z, clamp, animated);
  }

  zoomToArea(/*top, left, bottom, right, clamp = !!this.bounds*/) {
    // this._emitState('start');
    // parameters should be a percentage?
  }

  _scaleToScaleDelta(z) {
    return (this._z - z) / this._zoomSpeed;
  }

  _percentToTranslation(px, py) {
    const bw = this.boundingWidth; //this.boundingElement.offsetWidth;
    const bh = this.boundingHeight; //this.boundingElement.offsetHeight;
    const rect = this.element.getBoundingClientRect();
    return {
      x: (bw/2) - ( rect.width * px),
      y: (bh/2) - (rect.height * py),
    };
  }

  // For ease of use, expose methods to determine object-fit sizes
  // so consumers can use it to determine zoom levels.
  getContainSize(element = this.element, bounds = this.boundingElement) {
    const parent = bounds.getBoundingClientRect();
    const child = element.getBoundingClientRect();
    const fit = fitAndPosition(parent, child, 'contain', '50%', '50%');
    return {
      ...fit,
      scale: fit.width / child.width,
    };
  }

  getCoverSize(element = this.element, bounds = this.boundingElement) {
    const parent = bounds.getBoundingClientRect();
    const child = element.getBoundingClientRect();
    const fit = fitAndPosition(parent, child, 'cover', '50%', '50%');
    return {
      ...fit,
      scale: fit.width / child.width,
    };
  }

  getScaleDownSize(element = this.element, bounds = this.boundingElement) {
    const parent = bounds.getBoundingClientRect();
    const child = element.getBoundingClientRect();
    const fit = fitAndPosition(parent, child, 'scale-down', '50%', '50%');
    return {
      ...fit,
      scale: fit.width / child.width,
    };
  }

  _fitToBounds(type = 'contain', clamp, animated, immediate) {
    const parent = this.boundingElement.getBoundingClientRect();
    const child = this.element.getBoundingClientRect();
    const {x, y, width} = fitAndPosition(parent, child, type, '50%', '50%');
    let z = (width / child.width) * this._z;

    // this.debug('FIT TO BOUNDS',
    //   'x', x,
    //   'y', y,
    //   'z', z,
    //   'width', width,
    //   'height', height,
    //   'element', this.element,
    //   'bounding element', this.boundingElement,
    // );
    this._emitState('start');
    this._setState(x, y, z, clamp, animated, immediate);
  }

  onGestureStart() {
    this._moving = true;
    // These events will contain the values before any changes.
    this._emitState('start');
    this._emitState('gesturestart');
  }

  onGestureEnd() {
    this._moving = false;
    this._clampStateAfterTransition();
    this._emitState('end');
    this._emitState('gestureend');
  }

  onGestureChange({
    dx = 0, // Change in x position (when panning only)
    dy = 0, // Change in y position (when panning only)
    dz = 0, // Change in scale (when mouse or touch zooming only)
    // Panning = Initial x/y of the mouse relative to the top left of the element.
    // Zooming = Initial x/y of the center of the zoom gesture relative to the
    //   top left of the element at time of zoom start.
    // x0,
    // y0,
    // x,
    // y,
    px0,
    py0,
    event,
  }) {
    if (this.enabled) {
      event.preventDefault();

      // this.debug(
      //   'CHANGE',
      //   'dx', dx,
      //   'dy', dy,
      //   'dz', dz,
      //   'px0', px0,
      //   'py0', py0,
      // );

      // New values
      let nx = this._x;
      let ny = this._y;
      let nz = this._z;

      // Update the pan position.
      if (this._panEnabled) {
        nx += dx;
        ny += dy;
      }

      if (this._zoomEnabled) {
        const p = this._calculatePositionForZoom(this._z, dz, px0, py0);
        // this.log(
        //   'SCALE ADJUSTED POSITION',
        //   '_z', this._z,
        //   'dz', dz,
        //   'nx', nx,
        //   'ny', ny,
        //   'nz', nz,
        //   'p', p
        // );

        // Adjust to keep the focus centered around the mouse.
        nx += p.x;
        ny += p.y;

        // Update the zoom value.
        nz = p.z;
      }

      this._gestureUpdate(nx, ny, nz, px0, py0);
    }
  }

  /**
   * Pan the element from it's current position by some number of pixels.
   * @param {number} [dx] - Horizontal pixels to move by.
   * @param {number} [dy] - Vertical pixels to move by.
   */
  panBy(dx, dy, clamp, animated) {
    // New values
    let x = this._x + dx;
    let y = this._y + dy;

    this._setState(x, y, this._z, clamp, animated);
  }

  /**
   * Zoom the elment from it's current zoom around a center point.
   * @param {number} [dz] - Scale to add/subtract from the current scale.
   * @param {number} [cx] - X center of scaling as a percentage of the element width.
   * @param {number} [cy] - Y center of scalling as a percentage of the element height.
   */
  zoomBy(dz, cpx, cpy, clamp, animated) {
    // New values
    let nx = this._x;
    let ny = this._y;
    let nz = this._z;

    const p = this._calculatePositionForZoom(this._z, dz, cpx, cpy);
    // Adjust to keep the focus centered around the mouse.
    nx += p.x;
    ny += p.y;

    // Update the zoom value.
    nz = p.z;

    this._setState(nx, ny, nz, clamp, animated);
  }

  onDoubleClick({px0, py0}) {
    if (this._zoomEnabled) {
      let max = this.maxZoom;
      let min = this.minZoom;

      if (this.initialFit) {
        if (this.initialFit === 'contain') min = this.getContainSize().scale;
        else if (this.initialFit === 'cover') min = this.getCoverSize().scale;
        else if (this.initialFit === 'scale-down') min = this.getScaleDownSize().scale;
      }

      const mid = min + ((max - min) / 2);
      const z = this._z > mid ? min : max;
      const dz = (this._z - z) / this._zoomSpeed;
      this.log('DOUBLE CLICK',
        'this._z', this._z,
        'mid', mid,
        'z', z,
        'dz', dz,
      );

      this.zoomBy(dz, px0, py0, true);
    }
  }

  onResize() {
    this._clampStateAfterTransition();
    this.info('resize end');
  }

  _setState(x, y, z, clamp, animated = true, immediate) {
    if (animated) {
      this._transitionTo(x, y, z, clamp);
    } else {
      this.update(x, y, z, clamp, immediate);
    }
  }

  _transitionTo(x = 0, y = 0, z = 1, clamp) {
    if (this._x !== x || this._y !== y || this._z !== z) {
      this.log('TRANSITION TO',
        'x', x,
        'y', y,
        'z', z,
      );

      this._x = x;
      this._y = y;
      this._z = z;

      this._transitionToState(clamp);
    }
  }

  /**
   * Cancel any existing request animation frame
   * callbacks.
   */
  _cancelRAF() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Handle a programatic update. This will set
   * the current state and schedule a UI update.
   * It will also emit an update event.
   */
  update(x, y, z, clamp = true, immediate = false) {
    // If not in immediate mode, ensure moving is set
    // until the requestAnimationFrame is called.
    if (!immediate) this._moving = true;

    if (clamp) {
      const result = this._clampPanZoom(x, y, z);
      this._x = result.x;
      this._y = result.y;
      this._z = result.z;
    } else {
      this._x = x;
      this._y = y;
      this._z = z;
    }
    // Cancel any existing raf or transitions
    this._cancelRAF();
    this._cancelTransitions();

    // immediate mode is only used during initialFit to ensure
    // that the target element doesn't jump on screen. This will
    // also bypass event emission because it should be transparent
    // to users of this library.
    if (immediate) {
      this._setTransform(this._x, this._y, this._z);
    } else {
      // Schedule a new update
      this.rafId = requestAnimationFrame(() => {
        this._setTransform(this._x, this._y, this._z);
        this.rafId = null;
        this._moving = false;
        this._emitState('update');
      });
    }
  }

  /**
   * Handle updates as a result of a user gesture.
   * This will set the current state and schedule UI
   * updates. It will also emit start/update/end
   * events.
   */
  _gestureUpdate(x, y, z, cx, cy) {
    // Update the saved position.
    this._x = x;
    this._y = y;
    this._z = z;
    // TODO Do we really need to store these?
    this._cx = cx;
    this._cy = cy;

    // Cancel any existing raf or transitions
    this._cancelRAF();
    this._cancelTransitions();

    // Schedule a new update
    this.rafId = requestAnimationFrame(() => {
      this._setTransform(this._x, this._y, this._z);
      this.rafId = null;

      this._emitState('update');
    });
  }

  _calculatePositionForZoom(z, dz, cpx, cpy) {
    // If there's no change in z, return early.
    if (dz === 0) return {x: 0, y: 0, z};

    let nz = z;
    // TODO Scaling should happen outside of this method
    // Scaled Delta Z
    const sdz = dz * -1 * this._zoomSpeed;

    // Delta of the scale value.
    const zoomClampType = 0;
    // No overscroll past the min/max zoom.
    if (zoomClampType === 0) {
      nz = Math.min(
        Math.max(
          z + sdz,
          this.minZoom
        ),
        this.maxZoom
      );
    }
    // Allow a little bit of overscroll past the min/max zoom.
    // This has some weirdness but keeping the code for now.
    else if (zoomClampType === 1) {
      const absMin = this.minZoom - (this.minZoom * 0.5);
      const absMax = this.maxZoom + (this.maxZoom * 0.5);
      nz = Math.min(
        Math.max(
          z + sdz,
          absMin
        ),
        absMax
      );
    }
    // Allow full overscroll past the min/max zoom.
    // This feels a little strange when the mouse wheel moves
    // really far. The ideal solution would be to use the
    // mouse wheel to determine a velocity of scroll but
    // then to use our own velocity tracker (similar to
    // impetus) that would allow us to control the friction
    // of the movement.
    else {
      nz = Math.max(z + sdz, 0);
    }

    // If the zoom level has changed at all, shift the x/y position
    // in order to center the zoom around the touch/mouse center point.
    const diff = nz - z;
    const pos = diff ? this._getPositionAdjustedForScale(diff, cpx, cpy) : {x: 0, y: 0};

    // Return the new position.
    return {
      ...pos,
      z: nz,
    };
  }

  /**
   * Given a change in scale, translate the element
   * so the point of focus remains in the same place.
   */
  _getPositionAdjustedForScale(ds, px = 0, py = 0) {
    // Unscaled width and height.
    const w = this.elementWidth;
    const h = this.elementHeight;

    // Change in w/h since last zoom.
    const cw = w * ds;
    const ch = h * ds;

    // Change in x/y needed to offset scaling around the mouse/touch position.
    const cx = cw * px;
    const cy = ch * py;

    // this.debug(
    //   'POSITION ADJUSTED FOR SCALE',
    //   'ds', ds,
    //   'w',  w,
    //   'px', px,
    //   'cw', cw,
    //   'cx', cx,
    // );

    return {
      x: -cx,
      y: -cy,
    };
  }

  _clampZoom(z, cpx = 0.5, cpy = 0.5, min = this.minZoom, max = this.maxZoom) {
    let x = 0;
    let y = 0;

    let cz = z;
    // If min or max are null, don't clamp in that direction.
    if (min != null) cz = Math.max(cz, min);
    if (max != null) cz = Math.min(cz, max);

    if (z !== cz) {
      const dz = cz - z;

      const adjusted = this._getPositionAdjustedForScale(dz, cpx, cpy);
      x += adjusted.x;
      y += adjusted.y;

      this.info('CLAMP SCALE:',
        'unclamped scale', z,
        'clamped scale', cz,
        'dz', dz,
        'x', x,
        'y', y,
      );
    }

    return {x, y, z: cz};
  }

  _clampPan(x, y, b = this.bounds) {
    let cx = x;
    let cy = y;

    // If be is 0 or falsy, then clamping is off.
    if (b) {
      const wb = this.boundingWidth;
      const hb = this.boundingHeight;
      const w0 = this.elementWidth;
      const h0 = this.elementHeight;
      const w = Math.ceil(w0 * this._z);
      const h = Math.ceil(h0 * this._z);

      let xMin, yMin, xMax, yMax;
      // Define the bounds as a percentage of the dimensions of the bounding box.
      if (this.boundingType === 0) {
        // Min values are based on the scaled dimensions of the element.
        xMin = wb * (1 - b) - w;
        yMin = hb * (1 - b) - h;
        // Max values are based on the dimensions of the bounding element.
        xMax = wb * b;
        yMax = hb * b;
      }
      // Define the bounds as a percentage of the dimensions of the element.
      else if (this.boundingType === 1) {
        // The number of pixels of the element to be clamped.
        const px = w * b;
        const py = h * b;

        xMin = -px;
        yMin = -py;
        xMax = wb - (w - px);
        yMax = hb - (h - py);
      }
      // Convert the bounds into a pixel value.
      else {
        const px = Math.round(b * 100);
        xMin = -w + px;
        yMin = -h + px;
        xMax = wb - px;
        yMax = hb - px;
      }

      cx = Math.min(Math.max(x, xMin), xMax);
      cy = Math.min(Math.max(y, yMin), yMax);

      // Log the clamp
      if (cx !== x || cy !== y) {
        this.log('CLAMP X/Y:',
          'x', x,
          'clamped x', cx,
          'xMin', xMin,
          'xMax', xMax,
          'y', y,
          'clamped y', cy,
          'yMin', yMin,
          'yMax', yMax,
        );
      }
    }

    return {x: cx, y: cy};
  }

  _clampPanZoom(x = this._x, y = this._y, z = this._z) {
    let clamped = false;

    // Clamp Zooming
    const clampedZoom = this._clampZoom(z);
    if (clampedZoom.z !== z) {
      clamped = true;
      z = clampedZoom.z;
      x = clampedZoom.x;
      y = clampedZoom.y;
    }

    // Clamp Panning
    const clampedPan = this._clampPan(x, y);
    if (x !== clampedPan.x || y !== clampedPan.y) {
      clamped = true;
      x = clampedPan.x;
      y = clampedPan.y;
    }

    return { clamped, x, y, z };
  }

  /**
   * Clamp x/y/z to the bouding rect. This should only be
   * called at gesture end.
   */
  _clampStateAfterTransition() {
    const result = this._clampPanZoom();

    if (result.clamped) {
      this._x = result.x;
      this._y = result.y;
      this._z = result.z;

      this._transitionToState();
    }
  }

  _transitionToState(clamp) {
    this._setTransition(clamp);
    requestAnimationFrame(() => {
      this._setTransform(this._x, this._y, this._z);
      this._emitState('update');
    });
  }

  _cancelTransitions() {
    if (this._cancelTransitionEndListener) this._cancelTransitionEndListener();
  }

  _setTransition(clamp = true) {
    const originalTransition = this.element.style.transition;

    // If the element doesn't have a transform transition, then add our own.
    // TODO This will never emit a transition end
    if (!/transform /.test(originalTransition)) {
      // Handle the transition end event.
      const onTransitionEnd = () => {
        this._cancelTransitions();
        this._emitState('update');

        // Always set moving to false here because clamping may not
        // produce another transition. If it does, it will just set
        // moving back to true and then false again after the transition.
        this._moving = false;

        if (clamp) {
          this._clampStateAfterTransition();
        } else {
          this._emitState('end');
        }
      };

      // A function that can be called to cancel the current transition.
      this._cancelTransitionEndListener = () => {
        this.element.style.transition = originalTransition;
        this.element.removeEventListener('transitionend', onTransitionEnd);
        this._cancelTransitionEndListener = null;
      };

      this._moving = true;
      this.element.addEventListener('transitionend', onTransitionEnd);
      this.element.style.transition = 'transform 300ms cubic-bezier(0.785, 0.135, 0.150, 0.860)';
    }
  }

  /**
   * Turn off touch-action, user-select and other properties that interfer with
   * pan/zoom interactions.
   */
  _setSelectionProperties() {
    if (this.element.style.touchAction && this.element.style.touchAction !== 'none') {
      this.warn(
        'element already has a "touch-action" style set. ' +
        'PanZ will reset the "touch-action" to "none" for propery gesture handling.'
      );
    }

    // Turning the touch action off ensures that pinch gestures
    // don't zoom the page.
    this.element.style.touchAction = 'none';
    // Turning off user selection makes the gesture interactions a little
    // nicer by avoiding selections of items while panning.
    // this.element.style.userSelect = 'none';
    this.element.style.userSelect = 'none';
  }

  _setTransformOrigin() {
    if (this.element.style.transformOrigin) {
      this.warn(
        'element already has a "transform-origin" style set. ' +
        'PanZ will reset the "transform-origin" to "0 0" for proper pan/zoom functionality.'
      );
    }

    this.element.style.transformOrigin = '0 0';
    // TODO Figure out how to prevent flicker of element transition if
    // the scale is > 0
    // this.element.style.webkitBackfaceVisibility = 'hidden';
    // this.element.style.webkitTransformStyle = 'preserve-3d';
    // this.element.style.webkitTransform = 'translateZ(0)';
    // this.element.parentNode.style.webkitTransform = 'translate3d(0,0,0)';
  }

  _setTransform(x, y, z) {
    this.element.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
    // this.element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
  }

  _testTransform() {
    if (this.element.style.transform) {
      this.warn(
        'element already has a "transform" style set. ' +
        'Be aware that PanZ will modify the "transform" ' +
        'style during pan/zoom gestures, overriding your custom transform.'
      );
    }
  }

  // TODO Also emit the underlying event in case the user
  // needs to cancel it.
  _emitState(name) {
    const w0 = this.elementWidth;
    const h0 = this.elementHeight;
    const data = {
      x: this._x,
      y: this._y,
      scale: this._z,
      width: Math.ceil(w0 * this._z),
      height: Math.ceil(h0 * this._z),
      unscaledWidth: w0,
      unscaledHeight: h0,
    };
    const level = name === 'update' ? 'debug' : 'log';
    this[level](name.toUpperCase(),
      'x'     , data.x.toFixed(0),
      'y'     , data.y.toFixed(0),
      'scale' , data.scale.toFixed(4),
      'width' , data.width.toFixed(0),
      'height', data.height.toFixed(0),
      'originalWidth' , data.unscaledWidth,
      'originalHeight', data.unscaledHeight,
    );
    this.emit(name, data);
  }
}

// NOTES:
// Zoom in on a point
// https://stackoverflow.com/questions/2916081/zoom-in-on-a-point-using-scale-and-translate
// 10 pan zoom libraries: https://bashooka.com/coding/react-zoom-image-components/
//
