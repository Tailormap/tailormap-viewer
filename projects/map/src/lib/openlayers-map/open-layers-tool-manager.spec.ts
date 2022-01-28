import { OpenLayersToolManager } from './open-layers-tool-manager';
import { ToolTypeEnum } from '../models';

const mockNgZone = { run: (cb: () => void) => cb() } as any;

describe('OpenLayersToolManager', () => {

  test('creates a tool', () => {
    const onClick = jest.fn();
    const tool = { type: ToolTypeEnum.MapClick, onClick };
    const manager = new OpenLayersToolManager({} as any, mockNgZone);
    const toolId = manager.addTool(tool);
    expect(toolId).toMatch(/mapclick-\d+/);
  });

  test('enables and disables a tool', () => {
    const onFn = jest.fn();
    const unFn = jest.fn();
    const triggerMapClick = () => onFn.mock.calls[0][1]({ coordinate: [1,2], pixel: [2,3] });
    const map = { on: onFn, un: unFn } as any;
    const onClick = jest.fn();
    const tool = { type: ToolTypeEnum.MapClick, onClick };
    const manager = new OpenLayersToolManager(map, mockNgZone);
    const toolId = manager.addTool(tool);
    expect(onFn).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();

    manager.enableTool(toolId);
    expect(onFn).toHaveBeenCalled();
    triggerMapClick();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    });

    manager.disableTool(toolId);
    expect(unFn).toHaveBeenCalled();
  });

  test('handles destroy', () => {
    const onFn = jest.fn();
    const unFn = jest.fn();
    const triggerMapClick = () => onFn.mock.calls[0][1]({ coordinate: [1,2], pixel: [2,3] });
    const map = { on: onFn, un: unFn } as any;
    const onClick = jest.fn();
    const tool = { type: ToolTypeEnum.MapClick, onClick };
    const manager = new OpenLayersToolManager(map, mockNgZone);
    const toolId = manager.addTool(tool);

    manager.enableTool(toolId);
    expect(onFn).toHaveBeenCalled();
    triggerMapClick();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    });

    manager.destroy();
    expect(unFn).toHaveBeenCalled();

    onFn.mockClear();
    manager.enableTool(toolId);
    expect(onFn).not.toHaveBeenCalled();
  });

});
