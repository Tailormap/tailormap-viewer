import { ToolConfigModel } from '../models/tools/tool-config.model';
import { MapClickToolConfigModel } from '../models/tools/map-click-tool-config.model';
import { ToolTypeEnum } from '../models/tools/tool-type.enum';

export class ToolTypeHelper {

  public static isMapClickTool(tool: ToolConfigModel): tool is MapClickToolConfigModel {
    return tool.type === ToolTypeEnum.MapClick;
  }

}
