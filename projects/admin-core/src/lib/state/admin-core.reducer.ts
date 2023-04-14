import * as AdminCoreActions from './admin-core.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { AdminCoreState, initialAdminCoreState } from './admin-core.state';

const onSetRouteBeforeLogin = (
  state: AdminCoreState,
  payload: ReturnType<typeof AdminCoreActions.setRouteBeforeLogin>,
): AdminCoreState => ({
  ...state,
  routeBeforeLogin: payload.route || undefined,
});

const onSetLoginDetails = (
  state: AdminCoreState,
  payload: ReturnType<typeof AdminCoreActions.setLoginDetails>,
): AdminCoreState => ({
  ...state,
  security: {
    ...state.security,
    isAuthenticated: payload.isAuthenticated,
    username: payload.username || undefined,
    roles: payload.roles || undefined,
  },
});

const adminCoreReducerImpl = createReducer<AdminCoreState>(
  initialAdminCoreState,
  on(AdminCoreActions.setRouteBeforeLogin, onSetRouteBeforeLogin),
  on(AdminCoreActions.setLoginDetails, onSetLoginDetails),
);
export const adminCoreReducer = (state: AdminCoreState | undefined, action: Action) => adminCoreReducerImpl(state, action);
