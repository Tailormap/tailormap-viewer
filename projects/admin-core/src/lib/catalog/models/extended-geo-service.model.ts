import { GeoServiceModel } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';

export interface ExtendedGeoServiceModel extends GeoServiceModel {
  expanded?: boolean;
  layers: ExtendedGeoServiceLayerModel[];
}
