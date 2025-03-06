import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { getMapClickMock } from '../open-layers-tool-manager.spec';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', done => {
    // @ts-expect-error overwriting this prop in test is allowed
    OpenLayersEventManager.onMapClick$ = getMapClickMock();
    const tool = new OpenLayersMapClickTool('tool-123', { type: ToolTypeEnum.MapClick });
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

});
