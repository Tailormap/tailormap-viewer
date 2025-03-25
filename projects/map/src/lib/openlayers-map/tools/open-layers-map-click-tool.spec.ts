import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { of } from 'rxjs';
import { CesiumEventManager } from '../cesium-map/cesium-event-manager';
import { getMapClickMock } from '../open-layers-tool-manager.spec';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = getMapClickMock();
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick }, of(false));
    tool.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
        resolution: 0.1,
        scale: 714.2857142857143,
      });
      done();
    });
    tool.enable();
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
  });

  test('handles 3D map click', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [ 1, 2 ], pixel: [ 2, 3 ] }));
    CesiumEventManager.onMap3dClick$ = jest.fn(() => of({ position: { x: 3, y: 4, z: 5 }, mouseCoordinates: { x: 2, y: 3 } }));
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick }, of(true));
    tool.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 3, 4 ],
        mouseCoordinates: [ 2, 3 ],
      });
      done();
    });
    tool.enable();
    expect(CesiumEventManager.onMap3dClick$).toHaveBeenCalled();
  });

});
