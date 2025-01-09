import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { Selection3dModel, ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { of } from 'rxjs';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [ 1, 2 ], pixel: [ 2, 3 ] }));
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick }, of(null), of(false));
    tool.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
      });
      done();
    });
    tool.enable();
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
  });

  test('handles 3D map click', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [ 1, 2 ], pixel: [ 2, 3 ] }));
    const click3D: Selection3dModel = { position: { x: 3, y: 4, z: 5 } };
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick }, of(click3D), of(true));
    tool.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 3, 4 ],
        mouseCoordinates: [ 2, 3 ],
      });
      done();
    });
    tool.enable();
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
  });

  test('handles 2D map click when in 2D view', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [ 1, 2 ], pixel: [ 2, 3 ] }));
    const click3D: Selection3dModel = { position: { x: 3, y: 4, z: 5 } };
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick }, of(click3D), of(false));
    tool.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
      });
      done();
    });
    tool.enable();
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
  });

});
