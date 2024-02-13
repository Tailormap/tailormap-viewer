import { ServerType } from '@tailormap-viewer/api';
import { LayerSettingsModel } from './layer-settings.model';

export interface GeoServiceSettingsModel {
  serverType?: ServerType;
  useProxy?: boolean;
  defaultLayerSettings?: LayerSettingsModel;
  layerSettings?: Record<string, LayerSettingsModel>;
  xyzCrs?: string | null;
}
