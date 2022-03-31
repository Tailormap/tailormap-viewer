import { OpenLayersToolManager } from './open-layers-tool-manager';
import { MapClickToolModel, ToolTypeEnum } from '../models';
import { OpenLayersEventManager } from './open-layers-event-manager';
import { of } from 'rxjs';

const mockNgZone = { run: (cb: () => void) => cb() } as any;

describe('OpenLayersToolManager', () => {

  test('creates a tool', () => {
    const onClick = jest.fn();
    const tool = { type: ToolTypeEnum.MapClick, onClick };
    const manager = new OpenLayersToolManager({} as any, mockNgZone);
    const toolId = manager.addTool(tool);
    expect(toolId).toMatch(/mapclick-\d+/);
  });

  test('enables and disables a tool', done => {
    // @ts-ignore
    OpenLayersEventManager.onMapClick$ = jest.fn(() => of({ coordinate: [1,2], pixel: [2,3] }));
    const tool = { type: ToolTypeEnum.MapClick };
    const manager = new OpenLayersToolManager({} as any, mockNgZone);
    const toolId = manager.addTool(tool);
    expect(OpenLayersEventManager.onMapClick$).not.toHaveBeenCalled();
    manager.getTool<MapClickToolModel>(toolId)?.mapClick$.subscribe(clickEvt => {
      expect(clickEvt).toEqual({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
      });
      done();
    });
    manager.enableTool(toolId);
    expect(OpenLayersEventManager.onMapClick$).toHaveBeenCalled();
    manager.disableTool(toolId);
  });

  test('handles destroy', () => {
    const onMapClickFn = jest.fn(() => of({ coordinate: [1,2], pixel: [2,3] }));
    // @ts-ignore
    OpenLayersEventManager.onMapClick$ = onMapClickFn;
    const tool = { type: ToolTypeEnum.MapClick };
    const manager = new OpenLayersToolManager({} as any, mockNgZone);
    const toolId = manager.addTool(tool);

    manager.enableTool(toolId);
    expect(onMapClickFn).toHaveBeenCalled();
    manager.destroy();
    onMapClickFn.mockClear();
    manager.enableTool(toolId);
    expect(onMapClickFn).not.toHaveBeenCalled();
  });

});
