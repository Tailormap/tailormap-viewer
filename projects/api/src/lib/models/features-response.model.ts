import { ColumnMetadataModel } from './column-metadata.model';
import { FeatureModel } from './feature.model';
import { AttachmentAttributeModel } from './attachment-attribute.model';

export interface FeaturesResponseModel {
  features: FeatureModel[];
  columnMetadata: ColumnMetadataModel[];
  attachmentMetadata?: AttachmentAttributeModel[];
  template: string | null;
  total: number | null;
  page: number | null;
  pageSize: number | null;
}
