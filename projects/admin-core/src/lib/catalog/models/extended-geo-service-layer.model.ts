import { GeoServiceLayerModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceLayerModel extends GeoServiceLayerModel {
  id: string;
  serviceId: string;
  expanded?: boolean;
}
