import { ViewerStylingModel, ComponentModel, SecurityModel, I18nSettingsModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

export const coreStateKey = 'core';

export interface ViewerState {
  id?: string;
  title?: string;
  i18nSettings?: I18nSettingsModel;
  styling?: ViewerStylingModel;
  components: ComponentModel[];
}

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  security: SecurityModel;
  viewer?: ViewerState;
}

export const initialCoreState: CoreState = {
  loadStatus: LoadingStateEnum.INITIAL,
  security: { isAuthenticated: false },
};
