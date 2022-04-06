import * as MapActions from './map.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { MapState, initialMapState } from './map.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { LayerTreeNodeHelper } from '../helpers/layer-tree-node.helper';

const onLoadMap = (state: MapState): MapState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADING,
});

const onLoadMapSuccess = (
  state: MapState,
  payload: ReturnType<typeof MapActions.loadMapSuccess>,
): MapState => ({
  ...state,
  loadStatus: LoadingStateEnum.LOADED,
  mapSettings: {
    initialExtent: payload.initialExtent || undefined,
    maxExtent: payload.maxExtent || undefined,
    crs: payload.crs,
  },
  layers: [ ...payload.appLayers ],
  services: payload.services,
  baseLayerTreeNodes: payload.baseLayerTreeNodes.map(LayerTreeNodeHelper.getExtendedLayerTreeNode),
  layerTreeNodes: payload.layerTreeNodes.map(LayerTreeNodeHelper.getExtendedLayerTreeNode),
});

const onLoadMapFailed = (
  state: MapState,
  payload: ReturnType<typeof MapActions.loadMapFailed>,
): MapState => ({
  ...state,
  loadStatus: LoadingStateEnum.FAILED,
  errorMessage: payload.error,
});

const onSetLayerVisibility = (state: MapState, payload: ReturnType<typeof MapActions.setLayerVisibility>): MapState => ({
  ...state,
  layers: state.layers.map(layer => {
    const visible = typeof payload.visibility[layer.id] !== 'undefined'
      ? payload.visibility[layer.id]
      : layer.visible;
    return {
      ...layer,
      visible,
    };
  }),
});

const onSetSelectedLayerId = (state: MapState, payload: ReturnType<typeof MapActions.setSelectedLayerId>): MapState => ({
  ...state,
  selectedLayer: +(payload.layerId),
});

const mapReducerImpl = createReducer<MapState>(
  initialMapState,
  on(MapActions.loadMap, onLoadMap),
  on(MapActions.loadMapSuccess, onLoadMapSuccess),
  on(MapActions.loadMapFailed, onLoadMapFailed),
  on(MapActions.setLayerVisibility, onSetLayerVisibility),
  on(MapActions.setSelectedLayerId, onSetSelectedLayerId),
);
export const mapReducer = (state: MapState | undefined, action: Action) => mapReducerImpl(state, action);
