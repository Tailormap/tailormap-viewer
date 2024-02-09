import { GeoServiceSummaryModel } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from './catalog-extended.model';

export interface ExtendedGeoServiceModel extends GeoServiceSummaryModel, CatalogExtendedModel {
  type: CatalogExtendedTypeEnum.SERVICE_TYPE;
  expanded?: boolean;
  layerIds: string[];
  catalogNodeId: string;
}
