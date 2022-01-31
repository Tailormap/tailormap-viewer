import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { of } from 'rxjs';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', () => {
    // @ts-ignore
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [1,2], pixel: [2,3] }));
    const onClick = jest.fn();
    const tool = new OpenLayersMapClickTool({ type: ToolTypeEnum.MapClick, onClick });
    tool.enable();
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledWith({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    });
  });

});
