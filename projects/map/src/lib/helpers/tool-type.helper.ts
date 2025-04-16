import {
  ToolTypeEnum,
  ToolConfigModel,
  MapClickToolConfigModel,
  DrawingToolConfigModel,
  MousePositionToolConfigModel,
  ScaleBarToolConfigModel,
  SelectToolConfigModel,
  ModifyToolConfigModel, ExtTransformToolConfigModel,
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

  public static isModifyTool(tool: ToolConfigModel): tool is ModifyToolConfigModel {
    return tool.type === ToolTypeEnum.Modify;
  }

  public static isExtTransformTool(tool: ToolConfigModel): tool is ExtTransformToolConfigModel {
    return tool.type === ToolTypeEnum.ExtTransform;
  }
}
