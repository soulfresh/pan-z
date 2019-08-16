import MouseWheel from './MouseWheel';

describe('MouseWheel', function() {
  let wheel, listener1, listener2, element, eventBase,
    startEvent, updateEvent, endEvent;

  const resetListener = (listener) => {
    for(let prop in listener) {
      listener[prop].calls.reset();
    }
  };

  const resetListeners = () => {
    resetListener(listener1);
    resetListener(listener2);
  };

  beforeEach(() => jasmine.clock().install());
  afterEach( () => jasmine.clock().uninstall());

  beforeEach(function() {
    wheel = new MouseWheel();
    listener1 = jasmine.createSpyObj('Listener 1', ['start', 'end', 'update']);
    listener2 = jasmine.createSpyObj('Listener 2', ['start', 'end', 'update']);
    element = document.createElement('div');
    eventBase = {
      deltaX     : 0,
      detlaY     : 10,
      deltaZ     : 0,
      deltaMode  : 0x00,
      clientX    : 0,
      clientY    : 0,
    };
    startEvent = new WheelEvent('wheel', eventBase);
    updateEvent = new WheelEvent('wheel', eventBase);
    endEvent = new WheelEvent('wheel', eventBase);
  });

  describe('with multiple listeners', function() {
    beforeEach(function() {
      wheel.addEventListener('start'  , element, listener1.start);
      wheel.addEventListener('update' , element, listener1.update);
      wheel.addEventListener('end'    , element, listener1.end);
      wheel.addEventListener('start'  , element, listener2.start);
      wheel.addEventListener('update' , element, listener2.update);
      wheel.addEventListener('end'    , element, listener2.end);
    });

    describe('after wheel start', function() {

      beforeEach(function() {
        element.dispatchEvent(startEvent);
      });

      it('should notify on wheel start.', () => {
        expect(listener1.start).toHaveBeenCalledTimes(1);
        expect(listener1.start).toHaveBeenCalledWith(startEvent);
        expect(listener2.start).toHaveBeenCalledTimes(1);
        expect(listener2.start).toHaveBeenCalledWith(startEvent);
      });

      it('should notify on wheel events.', () => {
        expect(listener1.update).toHaveBeenCalledTimes(1);
        expect(listener1.update).toHaveBeenCalledWith(startEvent);
        expect(listener2.update).toHaveBeenCalledTimes(1);
        expect(listener2.update).toHaveBeenCalledWith(startEvent);
      });

      it('should not have called the end event yet.', () => {
        expect(listener1.end).not.toHaveBeenCalled();
        expect(listener2.end).not.toHaveBeenCalled();
      });

      describe('and an update', function() {
        beforeEach(function() {
          resetListeners();
          jasmine.clock().tick(20);
          element.dispatchEvent(updateEvent);
        });

        it('should not call the start listeners again.', () => {
          expect(listener1.start).not.toHaveBeenCalled();
          expect(listener2.start).not.toHaveBeenCalled();
        });

        it('should call the update listeners.', () => {
          expect(listener1.update).toHaveBeenCalledWith(updateEvent);
          expect(listener2.update).toHaveBeenCalledWith(updateEvent);
        });

        it('should not notify wheel end yet.', () => {
          expect(listener1.end).not.toHaveBeenCalled();
          expect(listener2.end).not.toHaveBeenCalled();
        });
      });
    });

    describe('after scrolling to the end', function() {
      beforeEach(function() {
        element.dispatchEvent(startEvent);

        jasmine.clock().tick(20);
        element.dispatchEvent(updateEvent);

        jasmine.clock().tick(20);
        element.dispatchEvent(endEvent);
      });

      it('should have called all of the listeners the correct number of times.', () => {
        expect(listener1.start).toHaveBeenCalledTimes(1);
        expect(listener2.start).toHaveBeenCalledTimes(1);
        expect(listener1.update).toHaveBeenCalledTimes(3);
        expect(listener2.update).toHaveBeenCalledTimes(3);
        expect(listener1.update).toHaveBeenCalledWith(endEvent);
        expect(listener2.update).toHaveBeenCalledWith(endEvent);
      });

      it('should not have called the end event until the specified timeout.', () => {
        expect(listener1.end).not.toHaveBeenCalled();
        expect(listener2.end).not.toHaveBeenCalled();
      });

      describe('and then waiting for the end timeout', function() {
        beforeEach(function() {
          jasmine.clock().tick(wheel.frequency);
        });

        it('should have called the end listener.', () => {
          expect(listener1.end).toHaveBeenCalledWith(endEvent);
          expect(listener2.end).toHaveBeenCalledWith(endEvent);
        });
      });
    });

    describe('after unsubscribing from wheel start and end events', function() {
      beforeEach(function() {
        wheel.removeEventListener('start', element, listener1.start);
        wheel.removeEventListener('end',   element, listener1.end);

        element.dispatchEvent(startEvent);
        element.dispatchEvent(updateEvent);
        jasmine.clock().tick(20);
        element.dispatchEvent(endEvent);
        jasmine.clock().tick(wheel.frequency);
      });

      it('should still send wheel updates to that listener.', () => {
        expect(listener1.update).toHaveBeenCalledTimes(3);
      });

      it('should not send wheel start/end events to that listener.', () => {
        expect(listener1.start).not.toHaveBeenCalled();
        expect(listener1.end).not.toHaveBeenCalled();
      });

      it('should still send all events to the subscribed listener.', () => {
        expect(listener2.start).toHaveBeenCalled();
        expect(listener2.update).toHaveBeenCalled();
        expect(listener2.end).toHaveBeenCalled();
      });
    });

    describe('after unsubscribing one listener from all events', function() {
      beforeEach(function() {
        wheel.removeEventListener('start', element, listener1.start);
        wheel.removeEventListener('update', element, listener1.update);
        wheel.removeEventListener('end',   element, listener1.end);

        element.dispatchEvent(startEvent);
        element.dispatchEvent(updateEvent);
        jasmine.clock().tick(20);
        element.dispatchEvent(endEvent);
        jasmine.clock().tick(wheel.frequency);
      });

      it('should not receive any wheel events to that listener.', () => {
        expect(listener1.start).not.toHaveBeenCalled();
        expect(listener1.update).not.toHaveBeenCalled();
        expect(listener1.end).not.toHaveBeenCalled();
      });

      it('should still receive wheel events to the subscribed listener.', () => {
        expect(listener2.start).toHaveBeenCalled();
        expect(listener2.update).toHaveBeenCalled();
        expect(listener2.end).toHaveBeenCalled();
      });
    });

    describe('after removing all start and end listeners', function() {
      beforeEach(function() {
        wheel.removeEventListener('start', element, listener1.start);
        wheel.removeEventListener('end'  , element, listener1.end);
        wheel.removeEventListener('start', element, listener2.start);
        wheel.removeEventListener('end'  , element, listener2.end);

        element.dispatchEvent(startEvent);
        element.dispatchEvent(updateEvent);
        jasmine.clock().tick(20);
        element.dispatchEvent(endEvent);
        jasmine.clock().tick(wheel.frequency);
      });

      it('should still call the update events.', () => {
        expect(listener1.update).toHaveBeenCalledTimes(3);
        expect(listener2.update).toHaveBeenCalledTimes(3);
      });

      it('should not call the start/end events.', () => {
        expect(listener1.start).not.toHaveBeenCalled();
        expect(listener1.end).not.toHaveBeenCalled();
        expect(listener2.start).not.toHaveBeenCalled();
        expect(listener2.end).not.toHaveBeenCalled();
      });

      describe('and then resubscribing to start/end events', function() {
        beforeEach(function() {
          resetListeners();

          wheel.addEventListener('start', element, listener1.start);
          wheel.addEventListener('end'  , element, listener1.end);
          wheel.addEventListener('start', element, listener2.start);
          wheel.addEventListener('end'  , element, listener2.end);

          element.dispatchEvent(startEvent);
          element.dispatchEvent(updateEvent);
          jasmine.clock().tick(20);
          element.dispatchEvent(endEvent);
          jasmine.clock().tick(wheel.frequency);
        });

        it('should receive all events', () => {
          expect(listener1.start).toHaveBeenCalledTimes(1);
          expect(listener1.update).toHaveBeenCalledTimes(3);
          expect(listener1.end).toHaveBeenCalledTimes(1);
          expect(listener2.start).toHaveBeenCalledTimes(1);
          expect(listener2.update).toHaveBeenCalledTimes(3);
          expect(listener2.end).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('after removing all update events', function() {
      beforeEach(function() {
        wheel.removeEventListener('update', element, listener1.update);
        wheel.removeEventListener('update', element, listener2.update);

        element.dispatchEvent(startEvent);
        element.dispatchEvent(updateEvent);
        jasmine.clock().tick(20);
        element.dispatchEvent(endEvent);
        jasmine.clock().tick(wheel.frequency);
      });

      it('should not receive any update events.', () => {
        expect(listener1.update).not.toHaveBeenCalled();
        expect(listener2.update).not.toHaveBeenCalled();
      });

      it('should receive start/end events', () => {
        expect(listener1.start).toHaveBeenCalledTimes(1);
        expect(listener1.end).toHaveBeenCalledTimes(1);
        expect(listener2.start).toHaveBeenCalledTimes(1);
        expect(listener2.end).toHaveBeenCalledTimes(1);
      });
    });
  });
});
