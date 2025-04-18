import { ViewerStylingModel, ComponentModel, I18nSettingsModel, UiSettingsModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FilterGroupModel } from '@tailormap-viewer/api';

export const coreStateKey = 'core';

export interface ViewerState {
  id?: string;
  title?: string;
  uiSettings?: UiSettingsModel;
  i18nSettings?: I18nSettingsModel;
  filterGroups?: FilterGroupModel[];
  styling?: ViewerStylingModel;
  components: ComponentModel[];
}

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  viewer?: ViewerState;
}

export const initialCoreState: CoreState = {
  loadStatus: LoadingStateEnum.INITIAL,
};
