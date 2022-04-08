import * as CoreActions from './core.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CoreState, initialCoreState } from './core.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadApplication = (state: CoreState): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADING,
});

const onApplicationLoadSuccess = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadApplicationSuccess>,
): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADED,
  application: {
    id: payload.application.id,
    apiVersion: payload.application.apiVersion,
    name: payload.application.name,
    title: payload.application.title,
    lang: payload.application.lang,
    styling: payload.application.styling,
  },
  components: [ ...payload.components ],
});

const onApplicationLoadFailed = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadApplicationFailed>,
): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.FAILED,
  error: payload.error,
});

const onSetRouteBeforeLogin = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.setRouteBeforeLogin>,
): CoreState => ({
  ...state,
  routeBeforeLogin: payload.route || undefined,
});

const onSetLoginDetails = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.setLoginDetails>,
): CoreState => ({
  ...state,
  security: {
    ...state.security,
    loggedIn: payload.loggedIn,
    user: payload.user,
  },
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadApplication, onLoadApplication),
  on(CoreActions.loadApplicationSuccess, onApplicationLoadSuccess),
  on(CoreActions.loadApplicationFailed, onApplicationLoadFailed),
  on(CoreActions.setRouteBeforeLogin, onSetRouteBeforeLogin),
  on(CoreActions.setLoginDetails, onSetLoginDetails),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
