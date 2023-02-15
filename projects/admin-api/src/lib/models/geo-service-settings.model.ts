import { ServerType } from '@tailormap-viewer/api';
import { LayerSettingsModel } from './layer-settings.model';

export interface GeoServiceSettingsModel {
  serverType: ServerType;
  defaultLayerSettings: LayerSettingsModel;
  layerSettings: LayerSettingsModel[];
}
