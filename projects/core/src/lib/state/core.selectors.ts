import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState, CoreState, coreStateKey } from './core.state';
import { BaseComponentTypeEnum, ComponentModel } from '@tailormap-viewer/api';

const selectCoreState = createFeatureSelector<CoreState>(coreStateKey);
const selectViewerState = createSelector(selectCoreState, state => state.viewer);
export const selectViewerLoadingState = createSelector(selectCoreState, state => state.loadStatus);

export const selectViewerId = createSelector(selectViewerState, state => state?.id || null);
export const selectViewerTitle = createSelector(selectViewerState, state => state?.title || null);
export const selectViewerErrorMessage = createSelector(selectCoreState, (state) => state.error);

export const selectUserDetails = createSelector(selectCoreState, state => state.security);

export const selectComponentsConfig = createSelector(
  selectViewerState,
  state => {
    if (!state?.components || !Array.isArray(state.components)) {
      return [];
    }
    return state.components;
  },
);

export const selectComponentsConfigForType = (type: string | BaseComponentTypeEnum) => createSelector(
  selectComponentsConfig,
  components => {
    return components.find(c => c.type === type) || null;
  },
);

export const selectComponentTitle = (type: string, defaultTitle: string) => createSelector(
  selectComponentsConfigForType(type),
  config => config?.config.title || defaultTitle,
);

export const selectViewerStyling = createSelector(selectViewerState, state => state?.styling || null);
export const selectViewerLogo = createSelector(selectViewerStyling, styling => styling?.logo || null);
