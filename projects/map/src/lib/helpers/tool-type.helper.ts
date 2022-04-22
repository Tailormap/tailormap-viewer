import { ToolTypeEnum, ToolConfigModel, MapClickToolConfigModel, DrawingToolConfigModel, MousePositionToolConfigModel } from '../models';

export class ToolTypeHelper {

  public static isMapClickTool(tool: ToolConfigModel): tool is MapClickToolConfigModel {
    return tool.type === ToolTypeEnum.MapClick;
  }

  public static isDrawingTool(tool: ToolConfigModel): tool is DrawingToolConfigModel {
    return tool.type === ToolTypeEnum.Draw;
  }

  public static isMousePositionTool(tool: ToolConfigModel): tool is MousePositionToolConfigModel {
    return tool.type === ToolTypeEnum.MousePosition;
  }

}
