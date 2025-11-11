import { LayerDetailsModel } from '@tailormap-viewer/api';
import { FeatureWithMetadataModel } from './feature-with-metadata.model';

export interface EditFormInput {
  feature: FeatureWithMetadataModel | undefined;
  details: LayerDetailsModel | undefined;
  isNewFeature?: boolean;
}
