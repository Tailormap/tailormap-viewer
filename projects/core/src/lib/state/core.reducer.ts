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
  id: payload.application.id,
  apiVersion: payload.application.apiVersion,
  name: payload.application.name,
  title: payload.application.title,
  lang: payload.application.lang,
  styling: payload.application.styling,
  initialExtent: payload.map.initialExtent || undefined,
  maxExtent: payload.map.maxExtent || undefined,
  services: payload.map.services,
  baseLayers: payload.map.baseLayers,
  crs: payload.map.crs,
  components: [ ...payload.components ],
  layers: [ ...payload.layers ],
});

const onApplicationLoadFailed = (
  state: CoreState,
  payload: ReturnType<typeof CoreActions.loadApplicationFailed>,
): CoreState => ({
  ...state,
  loadStatus: LoadingStateEnum.FAILED,
  error: payload.error,
});

const coreReducerImpl = createReducer<CoreState>(
  initialCoreState,
  on(CoreActions.loadApplication, onLoadApplication),
  on(CoreActions.loadApplicationSuccess, onApplicationLoadSuccess),
  on(CoreActions.loadApplicationFailed, onApplicationLoadFailed),
);
export const coreReducer = (state: CoreState | undefined, action: Action) => coreReducerImpl(state, action);
