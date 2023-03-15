import { LayerSettingsModel } from '@tailormap-admin/admin-api';

export interface GeoServiceLayerSettingsModel {
  layerName: string;
  layerTitle: string;
  serviceId: string;
  settings: LayerSettingsModel;
}
