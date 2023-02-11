import { GeoServiceLayerModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceLayerModel extends GeoServiceLayerModel {
  expanded?: boolean;
}
