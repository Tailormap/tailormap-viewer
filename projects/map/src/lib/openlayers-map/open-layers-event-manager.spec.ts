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
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
  });

  test('registers and triggers onMove events', done => {
    ngZoneRunFn.mockClear();
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    OpenLayersEventManager.onMapMove$().subscribe(e => {
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
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    OpenLayersEventManager.onMapClick$().subscribe(e => {
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
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone, of(true));
    expect(onFn).toHaveBeenCalled();
    let emitted = false;
    OpenLayersEventManager.onMapClick$().subscribe(() => emitted = true);
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg[1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
    jest.runAllTimers();
    jest.advanceTimersByTime(1000);
    expect(emitted).toEqual(false);
    jest.useRealTimers();
  });

});
