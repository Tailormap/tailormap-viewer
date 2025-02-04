import { FeatureTypeSummaryModel } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from './catalog-extended.model';

export interface ExtendedFeatureTypeModel extends FeatureTypeSummaryModel, CatalogExtendedModel {
  type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE;
  catalogNodeId: string;
  originalId: string;
  featureSourceId: string;
  featureSourceProtocol: string;
}
