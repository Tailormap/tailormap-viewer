import { AppLayerModel, ColumnMetadataModel, FeatureModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  feature: FeatureModel;
  columnMetadata: Map<string, ColumnMetadataModel>;
  layer: AppLayerModel;
}
