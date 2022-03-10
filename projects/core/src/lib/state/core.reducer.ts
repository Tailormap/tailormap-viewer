import * as CoreActions from './core.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CoreState, initialCoreState } from './core.state';
import { LoadingStateEnum } from '@tailormap-viewer/api';

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
  map: {
    initialExtent: payload.map.initialExtent || undefined,
    maxExtent: payload.map.maxExtent || undefined,
    services: payload.map.services,
    baseLayers: payload.map.baseLayers,
    crs: payload.map.crs,
    components: [ ...payload.components ],
    layers: [ ...payload.layers ],
  },
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

const onSetLayerVisibility = (state: CoreState, payload: ReturnType<typeof CoreActions.setLayerVisibility>): CoreState => ({
  ...state,
  map: {
    ...state.map,
    layers: state.map.layers.map(layer => {
      const layerId = `${layer.id}`;
      const visible = typeof payload.visibility[layerId] !== 'undefined'
        ? payload.visibility[layerId]
        : layer.visible;
      return {
        ...layer,
        visible,
      };
    }),
  },
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadApplication, onLoadApplication),
  on(CoreActions.loadApplicationSuccess, onApplicationLoadSuccess),
  on(CoreActions.loadApplicationFailed, onApplicationLoadFailed),
  on(CoreActions.setRouteBeforeLogin, onSetRouteBeforeLogin),
  on(CoreActions.setLoginDetails, onSetLoginDetails),
  on(CoreActions.setLayerVisibility, onSetLayerVisibility),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
