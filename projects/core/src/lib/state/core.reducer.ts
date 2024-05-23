import * as CoreActions from './core.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CoreState, initialCoreState } from './core.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadViewer = (state: CoreState): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADING,
});

const onViewerLoadSuccess = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadViewerSuccess>,
): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADED,
  viewer: {
    id: payload.viewer.id,
    title: payload.viewer.title,
    i18nSettings: payload.viewer.i18nSettings,
    uiSettings: payload.viewer.uiSettings,
    styling: payload.viewer.styling,
    components: payload.viewer.components,
  },
});

const onViewerLoadFailed = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadViewerFailed>,
): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.FAILED,
  error: payload.error,
});

const onSetLoginDetails = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.setLoginDetails>,
): CoreState => ({
  ...state,
  security: {
    ...state.security,
    isAuthenticated: payload.isAuthenticated,
    username: payload.username || undefined,
    roles: payload.roles || undefined,
    properties: payload.properties || undefined,
    groupProperties: payload.groupProperties || undefined,
  },
});

const onUpdateViewerStyle = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.updateViewerStyle>,
): CoreState => ({
  ...state,
  viewer: typeof state.viewer === 'undefined' ? undefined : {
    ...state.viewer,
    styling: { ...state.viewer?.styling, ...payload.style },
  },
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadViewer, onLoadViewer),
  on(CoreActions.loadViewerSuccess, onViewerLoadSuccess),
  on(CoreActions.loadViewerFailed, onViewerLoadFailed),
  on(CoreActions.setLoginDetails, onSetLoginDetails),
  on(CoreActions.updateViewerStyle, onUpdateViewerStyle),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
