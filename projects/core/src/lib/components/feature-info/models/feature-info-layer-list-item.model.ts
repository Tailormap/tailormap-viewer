import { FeatureInfoLayerModel } from './feature-info-layer.model';

export interface FeatureInfoLayerListItemModel extends FeatureInfoLayerModel {
  selected: boolean;
  disabled: boolean;
}
