import { FeatureSourceModel } from '@tailormap-admin/admin-api';
import { ExtendedFeatureTypeModel } from './extended-feature-type.model';

export interface ExtendedFeatureSourceModel extends FeatureSourceModel {
  catalogNodeId: string;
  children?: string[];
  expanded?: boolean;
  featureTypes: ExtendedFeatureTypeModel[];
}
