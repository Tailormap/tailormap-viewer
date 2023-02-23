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
  payload: ReturnType<typeof CoreActions.loadViewerSuccess>,
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
    components: payload.application.components,
  },
});

const onApplicationLoadFailed = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadViewerFailed>,
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

const onUpdateApplicationStyle = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.updateViewerStyle>,
): CoreState => ({
  ...state,
  application: typeof state.application === 'undefined' ? undefined : {
    ...state.application,
    styling: { ...state.application?.styling, ...payload.style },
  },
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadViewer, onLoadApplication),
  on(CoreActions.loadViewerSuccess, onApplicationLoadSuccess),
  on(CoreActions.loadViewerFailed, onApplicationLoadFailed),
  on(CoreActions.setRouteBeforeLogin, onSetRouteBeforeLogin),
  on(CoreActions.setLoginDetails, onSetLoginDetails),
  on(CoreActions.updateViewerStyle, onUpdateApplicationStyle),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
