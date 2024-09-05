import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../models/feature-info-column-metadata.model';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';

export const featureInfoStateKey = 'feature_info';

export interface FeatureInfoState {
  mouseCoordinates?: [number, number];
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  dialogCollapsed: boolean;
  layers: FeatureInfoLayerModel[];
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  selectedLayerId?: string;
}

export const initialFeatureInfoState: FeatureInfoState = {
  dialogVisible: false,
  dialogCollapsed: false,
  layers: [],
  features: [],
  columnMetadata: [],
};
