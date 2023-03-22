import { FeatureTypeModel } from '@tailormap-admin/admin-api';

export interface ExtendedFeatureTypeModel extends FeatureTypeModel {
  catalogNodeId: string;
  featureSourceId: string;
}
