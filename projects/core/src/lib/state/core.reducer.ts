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

const onSetComponentEnabled = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.setComponentEnabled>,
): CoreState => ({
  ...state,
  viewer: {
    ...state.viewer,
    components: (state.viewer?.components || []).map(c => {
      if (c.type !== payload.componentType) {
        return c;
      }
      return {
        ...c,
        config: {
          ...c.config,
          enabled: payload.enabled,
        },
      };
    }),
  },
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadViewer, onLoadViewer),
  on(CoreActions.loadViewerSuccess, onViewerLoadSuccess),
  on(CoreActions.loadViewerFailed, onViewerLoadFailed),
  on(CoreActions.updateViewerStyle, onUpdateViewerStyle),
  on(CoreActions.setComponentEnabled, onSetComponentEnabled),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
