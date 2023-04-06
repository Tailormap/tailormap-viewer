import { AppLayerSettingsModel } from './app-layer-settings.model';

export interface AppSettingsModel {
  layerSettings: Record<string, AppLayerSettingsModel>;
}
