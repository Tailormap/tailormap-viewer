import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState, CoreState, coreStateKey } from './core.state';
import { ComponentModel } from '@tailormap-viewer/api';

const selectCoreState = createFeatureSelector<CoreState>(coreStateKey);
const selectViewerState = createSelector(selectCoreState, state => state.viewer);
export const selectViewerLoadingState = createSelector(selectCoreState, state => state.loadStatus);

export const selectViewerId = createSelector(selectViewerState, state => state?.id || null);
export const selectViewerTitle = createSelector(selectViewerState, state => state?.title || null);
export const selectRouteBeforeLogin = createSelector(selectCoreState, state => state.routeBeforeLogin);
export const selectViewerErrorMessage = createSelector(selectCoreState, (state) => state.error);

export const selectUserDetails = createSelector(selectCoreState, state => state.security);
export const selectHasInsufficientRights = createSelector(selectCoreState, state => state.hasInsufficientRights);

export const selectUserWithInsufficientRights = createSelector(
  selectUserDetails,
  selectHasInsufficientRights,
  (user, hasInsufficientRights) => {
    if (user.isAuthenticated && hasInsufficientRights) {
      return user.username;
    }
    return undefined;
  });

export const selectComponentsConfig = createSelector<CoreState, ViewerState | undefined, ComponentModel[]>(
  selectViewerState,
  state => {
    if (!state?.components || !Array.isArray(state.components)) {
      return [];
    }
    return state.components;
  },
);

export const selectViewerStyling = createSelector(selectViewerState, state => state?.styling || null);
export const selectViewerLogo = createSelector(selectViewerStyling, styling => styling?.logo || null);
