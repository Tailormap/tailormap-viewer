import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { firstValueFrom, of } from 'rxjs';
import { CesiumEventManager } from '../cesium-map/cesium-event-manager';
import { getMapClickMock } from '../open-layers-tool-manager.spec';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', async () => {
    const eventManager = new OpenLayersEventManager();
    // @ts-expect-error overwriting this prop in test is allowed
    eventManager.onMapClick$ = getMapClickMock();
    const cesiumEventManager = new CesiumEventManager();
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick, owner: 'owner' }, eventManager, cesiumEventManager);
    const clickEventPromise = firstValueFrom(tool.mapClick$);
    tool.enable();
    expect(eventManager.onMapClick$).toHaveBeenCalled();
    const clickEvt = await clickEventPromise;
    expect(clickEvt).toEqual({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
      resolution: 0.1,
      scale: 714.2857142857143,
      pointerType: 'mouse',
    });
  });

  test('handles 3D map click', async () => {
    const eventManager = new OpenLayersEventManager();
    // @ts-expect-error overwriting this prop in test is allowed
    eventManager.onMapClick$ = vi.fn(() => of({
      coordinate: [ 1, 2 ],
      pixel: [ 2, 3 ],
      map: { getView: () => ({ getResolution: () => 0.1, getProjection: () => ({ getMetersPerUnit: () => 2 }) }) },
      originalEvent: { pointerType: 'mouse' },
    }));
    const cesiumEventManager = new CesiumEventManager();
    cesiumEventManager.onMap3dClick$ = vi.fn(() => of({ position: { x: 3, y: 4, z: 5 }, mouseCoordinates: { x: 2, y: 3 } }));
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick, owner: 'owner' }, eventManager, cesiumEventManager);
    const clickEventPromise = firstValueFrom(tool.mapClick$);
    tool.enable();
    expect(cesiumEventManager.onMap3dClick$).toHaveBeenCalled();
    const clickEvt = await clickEventPromise;
    expect(clickEvt).toEqual({
      mapCoordinates: [ 3, 4 ],
      mouseCoordinates: [ 2, 3 ],
    });
  });

});
