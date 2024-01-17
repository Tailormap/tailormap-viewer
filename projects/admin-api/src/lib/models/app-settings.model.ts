import { AppLayerSettingsModel } from './app-layer-settings.model';
import { I18nSettingsModel, UiSettingsModel } from '@tailormap-viewer/api';

export interface AppSettingsModel {
  i18nSettings?: I18nSettingsModel;
  uiSettings?: UiSettingsModel;
  layerSettings: Record<string, AppLayerSettingsModel>;
}
