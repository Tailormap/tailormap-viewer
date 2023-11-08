import { AppLayerSettingsModel } from './app-layer-settings.model';
import { I18nSettingsModel } from '@tailormap-viewer/api';

export interface AppSettingsModel {
  i18nSettings?: I18nSettingsModel;
  layerSettings: Record<string, AppLayerSettingsModel>;
}
