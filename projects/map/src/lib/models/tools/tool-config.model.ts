import { ToolTypeEnum } from './tool-type.enum';

export interface ToolConfigModel {
  type: ToolTypeEnum;
  autoEnable?: boolean;
  alwaysEnabled?: boolean;
}
