import { MapStyleModel, ToolConfigModel, ToolTypeEnum } from '..';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';

export interface SelectToolConfigModel<T = FeatureModelAttributes> extends ToolConfigModel {
  type: ToolTypeEnum.Select;
  style: Partial<MapStyleModel> | ((feature: FeatureModel<T>) => MapStyleModel);
  layers?: string[];
}
