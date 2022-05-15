import { MapStyleModel, ToolConfigModel, ToolTypeEnum } from '..';

export interface SelectToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.Select;
  style: Partial<MapStyleModel>;
  layers?: string[];
}
