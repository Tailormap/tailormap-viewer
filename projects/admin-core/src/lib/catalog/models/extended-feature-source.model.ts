import { FeatureSourceSummaryModel } from '@tailormap-admin/admin-api';

export interface ExtendedFeatureSourceModel extends FeatureSourceSummaryModel {
  catalogNodeId: string;
  expanded?: boolean;
  featureTypesIds: string[];
}
