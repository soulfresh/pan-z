import PanZoom from './PanZoom';
import PanZoomPageObject from './PanZoom.page-object';

fdescribe('PanZoom', function() {
  let panzoom, element, container, page, initialWidth, initialHeight;

  let makeMoveEvent = (x, y) => ({
    srcEvent: {
      movementX: x,
      movementY: y,
      target: element,
      preventDefault: () => false,
    }
  });

  let doPan = (moves) => {
    panzoom.onPanStart(makeMoveEvent(0, 0));
    moves.forEach((m, i) =>
      panzoom.onPanMove(makeMoveEvent(m.x, m.y))
    );
    panzoom.onPanEnd(makeMoveEvent(0, 0));
  };

  let makeWheelEvent = (x, y, wheel) => ({
    offsetX: x,
    offsetY: y,
    deltaY: wheel,
    preventDefault: () => false,
    target: element,
  });

  let doWheel = (x, y, moves) => {
    panzoom.onWheelStart(makeWheelEvent(x, y, 0));
    moves.forEach((m, i) =>
      panzoom.onPinch(makeWheelEvent(x, y, m.wheel))
    );
    panzoom.onWheelStop(makeWheelEvent(x, y, 0));
  };

  beforeEach(function() {
    initialWidth = 100;
    initialHeight = 100;

    element = document.createElement('div');
    element.style.width = `${initialWidth}px`;
    element.style.height = `${initialHeight}px`;
    element.style.position = 'absolute';
    element.style.backgroundColor = 'green';
    element.style.opacity = 0.5;

    container = document.createElement('div');
    container.style.width = `${initialWidth}px`;
    container.style.height = `${initialHeight}px`;
    container.style.position = 'relative';
    container.style.backgroundColor = 'red';
    container.appendChild(element);

    document.body.appendChild(container);
    document.body.style.margin = 0;
  });

  afterEach(() => {
    container.remove();
  });

  describe('by default', () => {
    beforeEach(function() {
      panzoom = new PanZoom(element, {maxZoom: 4});
      panzoom.init();

      page = new PanZoomPageObject(container, element, panzoom);
    });

    it('should start unzoomed.', () => {
      expect(page.width).toEqual(initialWidth);
      expect(page.height).toEqual(initialHeight);
      expect(page.x).toEqual(0);
      expect(page.y).toEqual(0);
    });

    it('should be able to zoom in/out programatically.', () => {
      let x = 0;
      let y = 0;

      // Zoom from the bottom right corner.
      panzoom.zoom(1.5, 1, 1);
      // Top left corner is now shifted up/left by half the width/height.
      x = initialWidth * -0.5;
      y = initialHeight * -0.5;

      expect(page.width).toEqual(initialWidth * 1.5);
      expect(page.height).toEqual(initialHeight * 1.5);
      expect(page.x).toEqual(x);
      expect(page.y).toEqual(y);

      // Now zoom from the top left corner.
      panzoom.zoom(2, 0, 0);
      // The top left corner has not changed position.

      expect(page.width).toEqual(initialWidth * 2);
      expect(page.height).toEqual(initialHeight * 2);
      expect(page.x).toEqual(x);
      expect(page.y).toEqual(y);

      // Now zoom out from the point between top left corner and center.
      panzoom.zoom(1.5, 0.25, 0.25);
      // The top left corner has shrunk inward by 25% of half the initial width/height.
      x += initialWidth * 0.5 * 0.25;
      y += initialWidth * 0.5 * 0.25;

      expect(page.width).toEqual(initialWidth * 1.5);
      expect(page.height).toEqual(initialHeight * 1.5);
      expect(page.x).toEqual(x);
      expect(page.y).toEqual(y);

      // Now zoom in from the center.
      panzoom.zoom(3, 0.5, 0.5);
      // The top left corner is now shifted outward by 1.5 *
      // 1/2 the initial width/height.
      x -= initialWidth * 0.5 * 1.5;
      y -= initialWidth * 0.5 * 1.5;

      expect(page.width).toEqual(initialWidth * 3);
      expect(page.height).toEqual(initialHeight * 3);
      expect(page.x).toEqual(x);
      expect(page.y).toEqual(y);
    });

    it('should be able to pan programatically.', () => {
      panzoom.zoom(4, 0, 0);

      panzoom.pan(100, 100);
      expect(page.x).toEqual(100);
      expect(page.y).toEqual(100);

      panzoom.pan(200, -100);
      expect(page.x).toEqual(200);
      expect(page.y).toEqual(-100);

      panzoom.pan(-123, 234);
      expect(page.x).toEqual(-123);
      expect(page.y).toEqual(234);
    });

    it('should be able to center programatically.', () => {
      panzoom.zoom(4, 0, 0);
      panzoom.center();

      // The top left corner should be offset by twice the initial width.
      expect(page.x).toEqual(initialWidth  * -1.5);
      expect(page.y).toEqual(initialHeight * -1.5);
    });

    it('should be able to reset programatically.', () => {
      panzoom.zoom(4, 0, 0);
      panzoom.reset();

      expect(page.width).toEqual(initialWidth);
      expect(page.height).toEqual(initialHeight);
      expect(page.x).toEqual(0);
      expect(page.y).toEqual(0);
    });

    describe('when panning with the mouse', () => {
      let startEvent, updateEvent, endEvent;
      let startListener, moveListener, endListener;

      beforeEach(() => {
        startListener = jasmine.createSpy('startListener');
        moveListener = jasmine.createSpy('moveListener');
        endListener = jasmine.createSpy('endListener');

        panzoom.on('panstart', startListener);
        panzoom.on('pan', moveListener);
        panzoom.on('panend', endListener);

        panzoom.zoom(4, 0, 0);

        doPan([
          {x: -50, y: -50},
          {x: -50, y: -50},
          {x: -50, y: -50},
        ]);
      });

      it('should move to the correct location.', () => {
        expect(page.x).toBe(-150);
        expect(page.y).toBe(-150);
      });

      it('should not be able to move out of bounds.', () => {
        doPan([{x: -500, y: -500}]);

        expect(page.x).toBe(-300);
        expect(page.y).toBe(-300);
      });

      it('shoud notify of the new position.', () => {
        expect(startListener).toHaveBeenCalledTimes(1);
        expect(moveListener).toHaveBeenCalledTimes(3);
        expect(endListener).toHaveBeenCalledTimes(1);
      });
    });

    describe('when using the mouse wheel', function() {
      let startEvent, updateEvent, endEvent;
      let startListener, moveListener, endListener;

      beforeEach(() => {
        startListener = jasmine.createSpy('startListener');
        moveListener = jasmine.createSpy('moveListener');
        endListener = jasmine.createSpy('endListener');

        panzoom.on('zoomstart', startListener);
        panzoom.on('zoom', moveListener);
        panzoom.on('zoomend', endListener);
      });

      it('should zoom in/out.', () => {
        let scale = 1;

        // Zoom in
        page.simulateWheel(0, 0, [
          {wheel: 0.2 / panzoom.speed},
          {wheel: 0.1 / panzoom.speed},
          {wheel: 0.2 / panzoom.speed}
        ]);

        expect(page.width).toEqual(150);
        expect(page.height).toEqual(150);
        expect(page.x).toEqual(0);
        expect(page.y).toEqual(0);

        // Zoom out
        page.simulateWheel(50, 50, [
          {wheel: -0.2 / panzoom.speed},
          {wheel: -0.3 / panzoom.speed},
        ]);

        expect(page.width).toEqual(100);
        expect(page.height).toEqual(100);
        // Location should stay 0 due to clamping.
        expect(page.x).toEqual(0);
        expect(page.y).toEqual(0);

        // Zoom in
        page.simulateWheel(50, 50, [
          {wheel: 1 / panzoom.speed}
        ]);

        expect(page.width).toEqual(200);
        expect(page.height).toEqual(200);
        // Zoomed to 200% from the center so
        // we are positioned -50% of the width.
        expect(page.x).toEqual(-50);
        expect(page.y).toEqual(-50);


        // Zoom in
        page.simulateWheel(150, 150, [
          {wheel: 2 / panzoom.speed}
        ]);

        expect(page.width).toEqual(400);
        expect(page.height).toEqual(400);
        expect(page.x).toEqual(-300);
        expect(page.y).toEqual(-300);
      });

      it('should clamp to the zoom bounds.', () => {
        page.simulateWheel(50, 50, [
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
        ]);

        expect(page.width).toEqual(400);
        expect(page.height).toEqual(400);
        expect(page.x).toEqual(-150);
        expect(page.x).toEqual(-150);
      });

      it('shoud notify of the new position.', () => {
        page.simulateWheel(50, 50, [
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
          {wheel: 1 / panzoom.speed},
        ]);

        expect(startListener).toHaveBeenCalledTimes(1);
        expect(moveListener).toHaveBeenCalledTimes(4);
        expect(endListener).toHaveBeenCalledTimes(1);
      });
    });

    describe('when pinching', function() {
      xit('should zoom in/out.');
      xit('should clamp to the zoom bounds.');
      xit('shoud notify of the new position.');

      describe('and then resizing', function() {
        xit('should still be able to zoom in/out.');
        xit('should still be able to pan.');
      });
    });

    describe('when double clicking', function() {
      xit('should zoom in to the max zoom.');
      xit('shoud notify of the new position.');
      describe('twice', function() {
        xit('should zoom out to the min zoom.');
        xit('shoud notify of the new position.');
      });
    });

    describe('with clamping disabled', () => {
      xit('should be able to pan freely.');
    });

    describe('with panning disabled', () => {
      xit('should still be able to zoom.');
      xit('shoud notify of the new position.');
    });

    describe('with zooming disabled', () => {
      xit('should still be able to pan.');
      xit('shoud notify of the new position.');
    });

    describe('after resizing', () => {
      xit('should be able to pan.');
      xit('should be able to zoom.');
    });
  });
});
