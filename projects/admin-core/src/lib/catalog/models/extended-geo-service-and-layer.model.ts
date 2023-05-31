import { ExtendedGeoServiceModel } from './extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';

export interface ExtendedGeoServiceAndLayerModel {
  service: ExtendedGeoServiceModel;
  layer: ExtendedGeoServiceLayerModel;
}
