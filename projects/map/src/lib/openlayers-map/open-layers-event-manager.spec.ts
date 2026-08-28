import { OpenLayersEventManager } from './open-layers-event-manager';
import { of } from 'rxjs';

const ngZoneRunFn = jest.fn((cb: () => void) => cb());
const mockNgZone = { run: ngZoneRunFn } as any;

describe('OpenLayersEventManager', () => {

  test('registers events', () => {
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
  });

  test('registers and triggers onMove events', done => {
    ngZoneRunFn.mockClear();
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    eventManager.onMapMove$().subscribe(e => {
      expect(e).toEqual('test');
      done();
    });
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'moveend');
    moveEndReg[1]('test');
    expect(ngZoneRunFn).toHaveBeenCalled();
  });

  test('registers and triggers onClick events', done => {
    ngZoneRunFn.mockClear();
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    eventManager.onMapClick$().subscribe(e => {
      expect(e).toEqual('test_click');
      done();
    });
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg[1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
  });

  test('does not trigger onClick events when in 3D', () => {
    jest.useFakeTimers();
    ngZoneRunFn.mockClear();
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(true));
    expect(onFn).toHaveBeenCalled();
    let emitted = false;
    eventManager.onMapClick$().subscribe(() => emitted = true);
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg[1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
    jest.runAllTimers();
    jest.advanceTimersByTime(1000);
    expect(emitted).toEqual(false);
    jest.useRealTimers();
  });

  test('events are not shared between instances', () => {
    const onFnA = jest.fn();
    const olMapA = { on: onFnA };
    const eventManagerA = new OpenLayersEventManager();
    eventManagerA.initEvents(olMapA as any, mockNgZone, of(false));

    const onFnB = jest.fn();
    const olMapB = { on: onFnB };
    const eventManagerB = new OpenLayersEventManager();
    eventManagerB.initEvents(olMapB as any, mockNgZone, of(false));

    let emittedOnA = false;
    eventManagerA.onMapMove$().subscribe(() => emittedOnA = true);
    let emittedOnB = false;
    eventManagerB.onMapMove$().subscribe(() => emittedOnB = true);

    const moveEndRegB = onFnB.mock.calls.find(c => c[0] === 'moveend');
    moveEndRegB[1]('test');

    expect(emittedOnB).toEqual(true);
    expect(emittedOnA).toEqual(false);
  });

});
