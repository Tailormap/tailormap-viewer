import { ToolTypeEnum } from './tool-type.enum';

export interface ToolConfigModel {
  type: ToolTypeEnum;
  owner: string;
  autoEnable?: boolean;
  alwaysEnabled?: boolean;
}
