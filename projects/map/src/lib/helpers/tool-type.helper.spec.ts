import { ToolTypeHelper } from './tool-type.helper';
import { ToolTypeEnum } from '../models';

const getTool = (type: ToolTypeEnum | string) => ({ type } as any);

describe('ToolTypeHelper', () => {

  test('checks MapClickTool', () => {
    expect(ToolTypeHelper.isMapClickTool(getTool(ToolTypeEnum.MapClick))).toEqual(true);
    expect(ToolTypeHelper.isMapClickTool(getTool('SomeThingElse'))).toEqual(false);
  });

  test('checks DrawingTool', () => {
    expect(ToolTypeHelper.isMapClickTool(getTool(ToolTypeEnum.Draw))).toEqual(false);
    expect(ToolTypeHelper.isDrawingTool(getTool(ToolTypeEnum.Draw))).toEqual(true);
  });

});
