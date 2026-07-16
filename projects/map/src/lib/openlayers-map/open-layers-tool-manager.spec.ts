import { OpenLayersToolManager } from './open-layers-tool-manager';
import { MapClickToolModel, ToolTypeEnum } from '../models';
import { OpenLayersEventManager } from './open-layers-event-manager';
import { CesiumEventManager } from './cesium-map/cesium-event-manager';
import { OpenLayersSnappingManager } from './openlayers-snapping-manager';
import { of } from 'rxjs';

const mockNgZone = { run: (cb: () => void) => cb() } as any;

export const getMapClickMock = () => {
  return jest.fn(() => of({
    coordinate: [ 1, 2 ],
    pixel: [ 2, 3 ],
    map: {
      getView: () => ({
        getResolution: () => 0.1,
        getProjection: () => ({
          getMetersPerUnit: () => 2,
        }),
      }),
    },
    originalEvent: { pointerType: 'mouse' },
  }));
};

describe('OpenLayersToolManager', () => {

  test('creates a tool', () => {
    const onClick = jest.fn();
    const tool = { type: ToolTypeEnum.MapClick, owner: 'owner', onClick };
    const manager = new OpenLayersToolManager({} as any, mockNgZone, new OpenLayersEventManager(), new CesiumEventManager(), new OpenLayersSnappingManager());
    const mapTool = manager.addTool(tool);
    expect(mapTool?.id).toMatch(/mapclick-\d+/);
  });

  test('enables and disables a tool', done => {
    const eventManager = new OpenLayersEventManager();
    // @ts-expect-error overwriting this prop in test is allowed
    eventManager.onMapClick$ = getMapClickMock();
    const tool = { type: ToolTypeEnum.MapClick, owner: 'owner' };
    const manager = new OpenLayersToolManager({} as any, mockNgZone, eventManager, new CesiumEventManager(), new OpenLayersSnappingManager());
    const mapTool = manager.addTool(tool);
    expect(eventManager.onMapClick$).not.toHaveBeenCalled();
    manager.getTool<MapClickToolModel>(mapTool?.id || '')?.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
        resolution: 0.1,
        scale: 714.2857142857143,
        pointerType: 'mouse',
      });
      done();
    });
    manager.enableTool(mapTool?.id || '');
    expect(eventManager.onMapClick$).toHaveBeenCalled();
    manager.disableTool(mapTool?.id || '');
  });

  test('handles destroy', () => {
    const eventManager = new OpenLayersEventManager();
    const onMapClickFn = getMapClickMock();
    // @ts-expect-error overwriting this prop in test is allowed
    eventManager.onMapClick$ = onMapClickFn;
    const tool = { type: ToolTypeEnum.MapClick, owner: 'owner' };
    const manager = new OpenLayersToolManager({} as any, mockNgZone, eventManager, new CesiumEventManager(), new OpenLayersSnappingManager());
    const mapTool = manager.addTool(tool);

    manager.enableTool(mapTool?.id || '');
    expect(onMapClickFn).toHaveBeenCalled();
    manager.destroy();
    onMapClickFn.mockClear();
    manager.enableTool(mapTool?.id || '');
    expect(onMapClickFn).not.toHaveBeenCalled();
  });

});
