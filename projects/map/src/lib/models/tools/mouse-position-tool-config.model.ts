import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';

export interface MousePositionToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.MousePosition;
}
