import { describe, test, expect, vi } from 'vitest';
import { OpenLayersEventManager } from './open-layers-event-manager';
import { firstValueFrom, of } from 'rxjs';

const ngZoneRunFn = vi.fn((cb: () => void) => cb());
const mockNgZone = { run: ngZoneRunFn } as any;

describe('OpenLayersEventManager', () => {

  test('registers events', () => {
    const onFn = vi.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
  });

  test('registers and triggers onMove events', async () => {
    ngZoneRunFn.mockClear();
    const onFn = vi.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    const eventPromise = firstValueFrom(eventManager.onMapMove$());
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'moveend');
    moveEndReg![1]('test');
    expect(ngZoneRunFn).toHaveBeenCalled();
    const e = await eventPromise;
    expect(e).toEqual('test');
  });

  test('registers and triggers onClick events', async () => {
    ngZoneRunFn.mockClear();
    const onFn = vi.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(false));
    expect(onFn).toHaveBeenCalled();
    const eventPromise = firstValueFrom(eventManager.onMapClick$());
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg![1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
    const e = await eventPromise;
    expect(e).toEqual('test_click');
  });

  test('does not trigger onClick events when in 3D', () => {
    vi.useFakeTimers();
    ngZoneRunFn.mockClear();
    const onFn = vi.fn();
    const olMap = {
      on: onFn,
    };
    const eventManager = new OpenLayersEventManager();
    eventManager.initEvents(olMap as any, mockNgZone, of(true));
    expect(onFn).toHaveBeenCalled();
    let emitted = false;
    eventManager.onMapClick$().subscribe(() => emitted = true);
    const moveEndReg = onFn.mock.calls.find(c => c[0] === 'singleclick');
    moveEndReg![1]('test_click');
    expect(ngZoneRunFn).toHaveBeenCalled();
    vi.runAllTimers();
    vi.advanceTimersByTime(1000);
    expect(emitted).toEqual(false);
    vi.useRealTimers();
  });

  test('events are not shared between instances', () => {
    const onFnA = vi.fn();
    const olMapA = { on: onFnA };
    const eventManagerA = new OpenLayersEventManager();
    eventManagerA.initEvents(olMapA as any, mockNgZone, of(false));

    const onFnB = vi.fn();
    const olMapB = { on: onFnB };
    const eventManagerB = new OpenLayersEventManager();
    eventManagerB.initEvents(olMapB as any, mockNgZone, of(false));

    let emittedOnA = false;
    eventManagerA.onMapMove$().subscribe(() => emittedOnA = true);
    let emittedOnB = false;
    eventManagerB.onMapMove$().subscribe(() => emittedOnB = true);

    const moveEndRegB = onFnB.mock.calls.find(c => c[0] === 'moveend');
    moveEndRegB![1]('test');

    expect(emittedOnB).toEqual(true);
    expect(emittedOnA).toEqual(false);
  });

});
