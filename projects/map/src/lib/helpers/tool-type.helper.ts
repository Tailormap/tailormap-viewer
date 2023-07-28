import {
  ToolTypeEnum, ToolConfigModel, MapClickToolConfigModel, DrawingToolConfigModel, MousePositionToolConfigModel, ScaleBarToolConfigModel,
  SelectToolConfigModel,
} from '../models';

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

  public static isScaleBarTool(tool: ToolConfigModel): tool is ScaleBarToolConfigModel {
    return tool.type === ToolTypeEnum.ScaleBar;
  }

  public static isSelectTool(tool: ToolConfigModel): tool is SelectToolConfigModel {
    return tool.type === ToolTypeEnum.Select;
  }

}
