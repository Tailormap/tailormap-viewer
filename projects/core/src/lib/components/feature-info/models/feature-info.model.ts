import { AppLayerModel, ColumnMetadataModel, FeatureModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  features: FeatureModel[];
  columnMetadata: ColumnMetadataModel[];
  layer: AppLayerModel;
}
