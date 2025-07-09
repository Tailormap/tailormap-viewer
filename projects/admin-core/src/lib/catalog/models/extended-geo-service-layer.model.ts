import { GeoServiceLayerModel, GeoServiceProtocolEnum, LayerSettingsModel } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from './catalog-extended.model';

export interface ExtendedGeoServiceLayerModel extends GeoServiceLayerModel, CatalogExtendedModel {
  type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE;
  originalId: string;
  layerTitle: string;
  catalogNodeId: string;
  serviceId: string;
  layerSettings?: LayerSettingsModel;
  expanded?: boolean;
  parentId?: string;
  protocol?: GeoServiceProtocolEnum;
}
