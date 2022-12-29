import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplicationState, CoreState, coreStateKey } from './core.state';
import { ComponentModel } from '@tailormap-viewer/api';

const selectCoreState = createFeatureSelector<CoreState>(coreStateKey);
const selectApplicationState = createSelector(selectCoreState, state => state.application);
export const selectApplicationLoadingState = createSelector(selectCoreState, state => state.loadStatus);

export const selectApplicationId = createSelector(selectApplicationState, state => state?.id || null);
export const selectRouteBeforeLogin = createSelector(selectCoreState, state => state.routeBeforeLogin);
export const selectApplicationErrorMessage = createSelector(selectCoreState, (state) => state.error);

export const selectUserDetails = createSelector(selectCoreState, state => state.security);

export const selectComponentsConfig = createSelector<CoreState, ApplicationState | undefined, ComponentModel[]>(
  selectApplicationState,
  state => {
    if (!state?.components || !Array.isArray(state.components)) {
      return [];
    }
    return state.components;
  },
);

export const selectApplicationStyling = createSelector(selectApplicationState, state => state?.styling || null);
export const selectApplicationLogo = createSelector(selectApplicationStyling, styling => styling?.logo || null);
