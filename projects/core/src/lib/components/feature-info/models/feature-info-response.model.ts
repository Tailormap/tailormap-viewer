import { FeatureInfoFeatureModel } from './feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from './feature-info-column-metadata.model';

export interface FeatureInfoResponseModel {
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  layerName: string;
  error?: string;
}
