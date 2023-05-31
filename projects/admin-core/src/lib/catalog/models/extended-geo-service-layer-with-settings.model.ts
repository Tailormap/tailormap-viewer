import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceLayerWithSettingsModel extends ExtendedGeoServiceLayerModel {
  settings?: LayerSettingsModel | null;
}
