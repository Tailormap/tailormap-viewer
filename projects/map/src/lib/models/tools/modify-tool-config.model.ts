
import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';
import { MapStyleModel } from '../map-style.model';

export interface ModifyToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.Modify;
  style?: Partial<MapStyleModel>;
}
