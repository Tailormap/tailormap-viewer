import { FeatureSourceSummaryModel, FeatureTypeSummaryModel } from '@tailormap-admin/admin-api';

export interface FeatureSourceSummaryWithFeatureTypesModel extends FeatureSourceSummaryModel {
  featureTypes: FeatureTypeSummaryModel[];
}
