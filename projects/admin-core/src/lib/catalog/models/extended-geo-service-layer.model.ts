import { GeoServiceLayerModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceLayerModel extends GeoServiceLayerModel {
  originalId: string;
  catalogNodeId: string;
  serviceId: string;
  expanded?: boolean;
  parentId?: string;
}
