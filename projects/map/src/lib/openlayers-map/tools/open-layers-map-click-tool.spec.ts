import { OpenLayersMapClickTool } from './open-layers-map-click-tool';
import { ToolTypeEnum } from '../../models';

describe('OpenLayersMapClickTool', () => {

  test('creates and enables map click tool', () => {
    const onFn = jest.fn();
    const unFn = jest.fn();
    const map = {
      on: onFn,
      un: unFn,
    } as any;
    const onClick = jest.fn();
    const tool = new OpenLayersMapClickTool(map, { type: ToolTypeEnum.MapClick, onClick });
    tool.enable();
    expect(onFn).toHaveBeenCalled();
    expect(onFn.mock.calls[0][0]).toEqual('singleclick');
    tool.disable();
    expect(unFn).toHaveBeenCalled();
  });

  test('triggers onClick callback', () => {
    const onFn = jest.fn();
    const map = {
      on: onFn,
      un: jest.fn(),
    } as any;
    const onClick = jest.fn();
    const tool = new OpenLayersMapClickTool(map, { type: ToolTypeEnum.MapClick, onClick });
    tool.enable();
    const olMapClick = onFn.mock.calls[0][1];
    olMapClick({ coordinate: [1,2], pixel: [2,3] });
    expect(onClick).toHaveBeenCalledWith({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    });
  });

});
