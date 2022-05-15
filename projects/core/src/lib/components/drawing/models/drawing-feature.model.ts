import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { DrawingFeatureTypeEnum } from './drawing-feature-type.enum';

export interface DrawingFeatureModelAttributes extends FeatureModelAttributes {
  type: DrawingFeatureTypeEnum;
  selected?: boolean;
}

export type DrawingFeatureModel = FeatureModel<DrawingFeatureModelAttributes>;
