import { FeatureTypeSummaryModel } from '@tailormap-admin/admin-api';

export interface ExtendedFeatureTypeModel extends FeatureTypeSummaryModel {
  catalogNodeId: string;
  originalId: string;
  featureSourceId: string;
}
