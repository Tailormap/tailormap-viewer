import { LayerSettingsModel } from './layer-settings.model';
import { AdminServerType } from './admin-server-type.model';

export interface GeoServiceSettingsModel {
  serverType?: AdminServerType;
  useProxy?: boolean;
  defaultLayerSettings?: LayerSettingsModel;
  layerSettings?: Record<string, LayerSettingsModel>;
  xyzCrs?: string | null;
}
