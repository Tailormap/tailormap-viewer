import { AppLayerModel, ColumnMetadataModel, FeatureModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  feature: FeatureModel;
  columnMetadata: ColumnMetadataModel[];
  layer: AppLayerModel;
  sortedAttributes: Array<{ label: string; attributeValue: any; key: string }>;
}
