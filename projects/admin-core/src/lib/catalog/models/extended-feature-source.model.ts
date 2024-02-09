import { FeatureSourceSummaryModel } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from './catalog-extended.model';

export interface ExtendedFeatureSourceModel extends FeatureSourceSummaryModel, CatalogExtendedModel {
  type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE;
  catalogNodeId: string;
  expanded?: boolean;
  featureTypesIds: string[];
}
