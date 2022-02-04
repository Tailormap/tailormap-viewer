import { OpenLayersEventManager } from './open-layers-event-manager';

const ngZoneRunFn = jest.fn((cb: () => void) => cb());
const mockNgZone = { run: ngZoneRunFn } as any;

describe('OpenLayersEventManager', () => {

  test('registers events', () => {
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone);
    expect(onFn).toHaveBeenCalled();
  });

  test('registers and triggers onMove events', done => {
    ngZoneRunFn.mockClear();
    const onFn = jest.fn();
    const olMap = {
      on: onFn,
    };
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone);
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
    OpenLayersEventManager.initEvents(olMap as any, mockNgZone);
    expect(onFn).toHaveBeenCalled();
    OpenLayersEventManager.onMapClick$().subscribe(e => {
      expect(e).toEqual('test_click');
      done();
    });
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg[1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
  });

});
