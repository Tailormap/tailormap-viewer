import { FeatureSourceSummaryModel } from './feature-source-summary.model';
import { FeatureTypeSummaryModel } from './feature-type-summary.model';

export interface FeatureSourceSummaryWithFeatureTypesModel extends FeatureSourceSummaryModel {
  featureTypes: FeatureTypeSummaryModel[];
}
