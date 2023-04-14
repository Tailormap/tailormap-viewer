import { AdminCoreState, adminCoreStateKey } from './admin-core.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectAdminCoreState = createFeatureSelector<AdminCoreState>(adminCoreStateKey);

export const selectRouteBeforeLogin = createSelector(selectAdminCoreState, state => state.routeBeforeLogin);
export const selectUserDetails = createSelector(selectAdminCoreState, state => state.security);
