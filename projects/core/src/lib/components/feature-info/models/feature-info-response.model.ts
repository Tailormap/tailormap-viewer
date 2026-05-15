import { FeatureInfoFeatureModel } from './feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from './feature-info-column-metadata.model';
import { FeatureInfoAttachmentAttributeMetadata } from './feature-info-attachment-attribute-metadata.model';

export interface FeatureInfoResponseModel {
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  attachmentMetadata: FeatureInfoAttachmentAttributeMetadata[];
  template?: string | null;
  layerId: string;
  error?: string;
}

export const emptyFeaturesResponse = {
  features: [],
  columnMetadata: [],
  attachmentMetadata: [],
  template: null,
};
