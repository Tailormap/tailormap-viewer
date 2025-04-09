import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';
import { MapStyleModel } from '../map-style.model';

export interface ExtTransformToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.ExtTransform;
  style?: Partial<MapStyleModel>;
}
