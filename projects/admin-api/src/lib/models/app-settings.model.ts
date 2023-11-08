import { AppLayerSettingsModel } from './app-layer-settings.model';
import { I18nSettingsModel } from '@tailormap-viewer/api';

export interface AppSettingsModel {
  i1n8Settings?: I18nSettingsModel;
  layerSettings: Record<string, AppLayerSettingsModel>;
}
