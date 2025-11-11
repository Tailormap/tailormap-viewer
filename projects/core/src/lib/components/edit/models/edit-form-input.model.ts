import { ColumnMetadataModel, FeatureModel, LayerDetailsModel } from '@tailormap-viewer/api';

export interface EditFormInput {
  feature: FeatureModel | undefined;
  details: LayerDetailsModel | undefined;
  columnMetadata: ColumnMetadataModel[];
  isNewFeature?: boolean;
}
