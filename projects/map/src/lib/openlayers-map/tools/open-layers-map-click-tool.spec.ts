import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { of } from 'rxjs';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [ 1, 2 ], pixel: [ 2, 3 ] }));
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick });
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
