import { GeoServiceModel } from './geo-service.model';
import { GeoServiceLayerModel } from './geo-service-layer.model';

export interface GeoServiceWithLayersModel extends GeoServiceModel {
  layers: GeoServiceLayerModel[];
}
