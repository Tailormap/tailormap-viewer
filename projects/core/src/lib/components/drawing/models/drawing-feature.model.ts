import { FeatureModel } from '@tailormap-viewer/api';
import { DrawingFeatureTypeEnum } from './drawing-feature-type.enum';

export interface DrawingFeatureModel extends FeatureModel {
  attributes: {
    type: DrawingFeatureTypeEnum;
  };
}
