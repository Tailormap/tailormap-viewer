import { ExtendedGeoServiceModel } from './extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceAndLayerModel {
  service: ExtendedGeoServiceModel;
  layer: ExtendedGeoServiceLayerModel;
  layerSettings: LayerSettingsModel | null;
}
