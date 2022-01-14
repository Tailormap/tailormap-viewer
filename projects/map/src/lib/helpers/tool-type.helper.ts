import { ToolModel } from '../models/tools/tool.model';
import { MapClickToolModel } from '../models/tools/map-click-tool.model';
import { ToolTypeEnum } from '../models/tools/tool-type.enum';

export class ToolTypeHelper {

  public static isMapClickTool(tool: ToolModel): tool is MapClickToolModel {
    return tool.type === ToolTypeEnum.MapClick;
  }

}
