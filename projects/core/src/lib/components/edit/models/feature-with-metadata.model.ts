import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../../feature-info/models/feature-info-column-metadata.model';

export interface FeatureWithMetadataModel {
  feature: FeatureInfoFeatureModel;
  columnMetadata: FeatureInfoColumnMetadataModel[];
}
