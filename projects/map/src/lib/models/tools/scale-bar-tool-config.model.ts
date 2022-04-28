import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';

export interface ScaleBarToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.ScaleBar;
}
