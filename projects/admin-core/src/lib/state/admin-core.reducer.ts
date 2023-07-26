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
  hasInsufficientRights: false,
  security: {
    ...state.security,
    isAuthenticated: payload.isAuthenticated,
    username: payload.username || undefined,
    roles: payload.roles || undefined,
  },
});

const onSetInsufficientRights = (
  state: AdminCoreState,
  payload: ReturnType<typeof AdminCoreActions.setInsufficientRights>,
): AdminCoreState => ({
  ...state,
  hasInsufficientRights: payload.hasInsufficientRights,
});

const adminCoreReducerImpl = createReducer<AdminCoreState>(
  initialAdminCoreState,
  on(AdminCoreActions.setRouteBeforeLogin, onSetRouteBeforeLogin),
  on(AdminCoreActions.setLoginDetails, onSetLoginDetails),
  on(AdminCoreActions.setInsufficientRights, onSetInsufficientRights),
);
export const adminCoreReducer = (state: AdminCoreState | undefined, action: Action) => adminCoreReducerImpl(state, action);
