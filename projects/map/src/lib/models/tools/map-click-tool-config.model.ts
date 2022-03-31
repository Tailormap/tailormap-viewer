import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';

export interface MapClickToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.MapClick;
}
