import { ComponentModel } from './component.model';
import { ViewerStylingModel } from './viewer-styling.model';
import { I18nSettingsModel } from './i18n-settings.model';
import { UiSettingsModel } from './ui-settings.model';

export interface ViewerResponseModel {
  id: string;
  kind: string;
  name: string;
  title: string;
  baseViewers: string[];
  i18nSettings?: I18nSettingsModel;
  uiSettings?: UiSettingsModel;
  projections: string[];
  styling?: ViewerStylingModel;
  components: ComponentModel[];
}
