/**
 * @module  pan-zoom
 *
 * Events for pan and zoom
 */


import Impetus from './impetus';
import wheel from 'mouse-wheel';
import touchPinch from './touch-pinch';
import position from 'touch-position';
import raf from 'raf';
import debounce from 'lodash.debounce';
import doubleTap from './double-tap';

function panZoom (target, cb, options) {
  if (target instanceof Function) {
    cb = target;
    target = document.documentElement || document.body;
  }

  if (!options) options = {};
  function onStart(e) {
    if (options.onStart) options.onStart(e);
  }
  function onEnd(e) {
    if (options.onEnd) {
      // Delay the end callback so it occurs after
      // the last update.
      raf(function() {
        options.onEnd(e);
      });
    }
  }
  function onDoubleTap(e) {
    if (options.onDoubleTap) options.onDoubleTap(e);
  }

  var actionEndTracker = null;
  var startEvent = null;
  var lastEvent = null;
  var actionEndThreshold = 60;

  /**
   * Because wheel and impetus don't emit end events,
   * we'll use a tracker that listens for updates every
   * `actionEndThreshold`. When those updates end, we'll
   * call that the end event.
   *
   * This action tracker function will
   * 1) call onStart if it is defined
   * 2) track when a gesture event ends and call onEnd if it is defined
   * 3) indicate if this is a start event
   * 4) return current gesture event to broadcast
   * 5) return the initial gesture event
   * 6) return the last gesture event.
   *
   * @return {object} with the following properties:
   * - isStart {boolean}
   * - event {object} the current event object to broadcast
   * - init {object} initial event object
   * - last {object} the last event object broadcast
   */
  function updateTracker(o) {
    if (!o) o = {};

    var rect = target.getBoundingClientRect();
    var tp = touchPosition(rect);

    // initial event
    var ie = startEvent || {};
    // last event
    var le = lastEvent || {};

    // current element x/y
    var x = o.x != null ? o.x : tp.x;
    var y = o.y != null ? o.y : tp.y;

    // last x/y
    var lx = le.x != null ? le.x : x;
    var ly = le.y != null ? le.y : y;

    // delta element x/y/z
    var dx = o.dx != null ? o.dx : x - lx;
    var dy = o.dy != null ? o.dy : y - ly;
    var dz = o.dz != null ? o.dz : 0;

    // touch x/y
    var x0 = ie.x0 != null ? ie.x0 : tp.x;
    var y0 = ie.y0 != null ? ie.y0 : tp.y;
    // touch x/y as percentage
    var px0 = ie.px0 != null ? ie.px0 : x0 / rect.width;
    var py0 = ie.py0 != null ? ie.py0 : y0 / rect.height;

    var event = {
      type: o.type || 'mouse',
      srcElement: o.srcElement || target,
      target: target,
      x: x, y: y,
      dx: dx, dy: dy, dz: dz,
      x0: x0, y0: y0,
      px0: px0, py0: py0,
    };
    var isStart = false;

    // On the first event, start a tracker
    // that waits for the events to stop.
    if (!actionEndTracker) {
      isStart = true;
      startEvent = lastEvent = event;

      onStart(event);
      actionEndTracker = debounce(function(e2) {
        // When wheel events have stopped for `actionEndThreshold`
        // consider that the end the wheel gesture.
        onEnd(e2);
        actionEndTracker = null;
        startEvent = null;
        lastEvent = null;
      }, actionEndThreshold);
    }
    // Keep the action end tracker alive.
    actionEndTracker(event);

    var out = {
      // If this was the start of the gesture.
      isStart: isStart,
      // The initial event that was dispatched.
      init: startEvent,
      // The previous event that was dispatched.
      last: lastEvent,
      // The current event.
      event: event,
    };

    lastEvent = out.event;

    return out;
  }

  if (typeof target === 'string') target = document.querySelector(target);

  //// PANNING ////
  // Track mouse/touch position on the window.
  var touch = position.emitter();
  // Get the current touch position relative to the target.
  // By using the window for tracking position, we ensure that
  // the relative touch position is correct even if the target
  // dimensions have changed since the last touch event.
  function touchPosition(rect) {
    if (!rect) rect = target.getBoundingClientRect();
    return {
      x: touch.position[0] - rect.x,
      y: touch.position[1] - rect.y
    };
  }

  var impetus;

  var srcElement;
  var initDimensions = {x: 0, y: 0, px: 0, py: 0};
  var lastX = 0, lastY = 0;

  impetus = new Impetus({
    source: target,
    update: function(x, y) {
      var rect = target.getBoundingClientRect();
      var tp = touchPosition(rect);

      var e = {
        srcElement,
        target: target,
        type: 'mouse',
        dx: x - lastX, dy: y - lastY, dz: 0,
        x: tp.x, y: tp.y,
        x0: initDimensions.x, y0: initDimensions.y,
        px0: initDimensions.px, py0: initDimensions.py,
      };

      lastX = x;
      lastY = y;

      cb(e);
    },
    multiplier: options.friction || 1,
    friction: options.multiplier || .75,
    boundX: options.boundX,
    boundY: options.boundY,
    bounce: options.bounce,
  });

  impetus.on('start', ({originalEvent}) => {
    var rect = target.getBoundingClientRect();
    var tp = touchPosition(rect);
    initDimensions = {
      x: tp.x,
      y: tp.y,
      px: tp.x / rect.width,
      py: tp.y / rect.height,
    };
    srcElement = originalEvent.srcElement;
    onStart({
      srcElement,
      target: target,
      type: 'mouse',
      dx: 0, dy: 0, dz: 0,
      x: tp.x, y: tp.y,
      x0: initDimensions.x, y0: initDimensions.y,
      px0: initDimensions.px, py0: initDimensions.py,
    });
  });

  impetus.on('end', () => {
    // console.info('END', x, y);
    var tp = touchPosition();
    onEnd({
      srcElement,
      target: target,
      type: 'mouse',
      dx: 0, dy: 0, dz: 0,
      x: tp.x, y: tp.y,
      x0: initDimensions.x, y0: initDimensions.y,
      px0: initDimensions.px, py0: initDimensions.py,
    });
  });

  // var initFn = function (e) { srcElement = e.srcElement; };
  // impetus = new Impetus({
  //   source: target,
  //   update: function (x, y) {
  //     // TODO Only emit the end event after releasing the mouse.
  //     // Should probably just add start and end events to impetus.
  //     var t = updateTracker({
  //       srcElement: srcElement,
  //       type: 'mouse',
  //       x: x,
  //       y: y,
  //     });
  //     cb(t.event);
  //   },
  //   multiplier: options.friction || 1,
  //   friction: options.multiplier || .75,
  //   boundX: options.boundX,
  //   boundY: options.boundY,
  //   bounce: options.bounce,
  // });

  var isPassive = [window, document, document.documentElement, document.body].indexOf(target) >= 0;

  //// ZOOMING ////
  var wheelListener = null;
  function enableMouseWheel() {
    if (!wheelListener) {
      return wheel(target, function (dx, dy, dz, e) {
        if (!isPassive) e.preventDefault();

        var t = updateTracker({
          dx: 0,
          dy: 0,
          dz: dy,
          srcElement: e.srcElement,
          type: 'mouse',
        });
        cb(t.event);
      });
    } else {
      return wheelListener;
    }
  }

  function disableMouseWheel() {
    if (wheelListener) {
      target.removeEventListener('wheel', wheelListener);
      wheelListener = null;
    }
  }

  wheelListener = enableMouseWheel();

  //// PINCHING ////
  // TODO Update pinch-zooming to allow panning while pinching.
  // Use Window?
  var pinch = touchPinch();
  var mult = 1.3;
  var initialCoords;

  function currentPinchCenter() {
    var f1 = pinch.fingers[0];
    var f2 = pinch.fingers[1];

    return [
      f2.position[0] * .5 + f1.position[0] * .5,
      f2.position[1] * .5 + f1.position[1] * .5
    ];
  }

  function withinBounds(x, y, rect) {
    if (!rect) rect = target.getBoundingClientRect();
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  pinch.on('start', function () {
    var c = currentPinchCenter();
    var d = target.getBoundingClientRect();
    var x = c[0];
    var y = c[1];
    if (withinBounds(x, y, d)) {
      x -= d.x;
      y -= d.y;
      initialCoords = {
        x: x,
        y: y,
        px0: x / d.width,
        py0: y / d.height,
      };

      impetus && impetus.pause();

      onStart();
    }
  });
  pinch.on('end', function () {
    if (!initialCoords) return;

    initialCoords = null;

    impetus && impetus.resume();

    onEnd();
  });
  pinch.on('change', function (curr, prev) {
    if (!pinch.pinching || !initialCoords) return;

    var dz = - (curr - prev) * mult;

    cb({
      srcElement: target,
      target: target,
      type: 'touch',
      dx: 0, dy: 0, dz: dz,
      x: initialCoords.x, y: initialCoords.x,
      x0: initialCoords.x, y0: initialCoords.x,
      px0: initialCoords.px0, py0: initialCoords.py0,
    });
  });

  //// DOUBLE TAP ////
  function startDoubleTap() {
    return doubleTap(function() {
      var rect = target.getBoundingClientRect();
      var pos = touchPosition(rect);
      // Call the double tap option instead of the change callback
      // because double tap to zoom gestures vary by application
      // and we want library users to be able to use their own
      // implementation.
      onDoubleTap({
        srcElement: target,
        target: target,
        type: 'mouse',
        dx: 0, dy: 0, dz: mult,
        x: pos.x, y: pos.x,
        x0: pos.x, y0: pos.x,
        px0: pos.x / rect.width, py0: pos.y / rect.height,
      });
    }, target);
  }
  let destroyDoubleTap = startDoubleTap();


  let unpanzoom = function () {
    touch.dispose();

    // target.removeEventListener('mousedown', initFn);
    // target.removeEventListener('touchstart', initFn);

    impetus.destroy();

    disableMouseWheel();
    destroyDoubleTap = destroyDoubleTap();

    pinch.disable();
  };

  unpanzoom.disablePan = function() {
    impetus && impetus.pause();
  };

  unpanzoom.enablePan = function() {
    impetus && impetus.resume();
  };

  unpanzoom.disableZoom = function() {
    pinch && pinch.disable();
    disableMouseWheel();
    destroyDoubleTap = destroyDoubleTap();
  };

  unpanzoom.enableZoom = function() {
    pinch && pinch.enable();
    wheelListener = enableMouseWheel();
    destroyDoubleTap = startDoubleTap();
  };

  return unpanzoom;
}


export default panZoom;