import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';

export interface GeoServiceLayerInApplicationModel {
  geoServiceLayer: ExtendedGeoServiceLayerModel;
  appLayerId: string;
}
