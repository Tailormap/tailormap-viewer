import { ColumnMetadataModel } from './column-metadata.model';
import { FeatureModel } from './feature.model';

export interface FeaturesResponseModel {
  features: FeatureModel[];
  columnMetadata: ColumnMetadataModel[];
  total: number | null;
  page: number | null;
  pageSize: number | null;
}
