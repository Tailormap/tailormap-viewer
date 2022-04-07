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
    const updated = payload.visibility.find(v => v.id === layer.id);
    const visible = updated
      ? updated.checked
      : layer.visible;
    return {
      ...layer,
      visible,
    };
  }),
});

const onSetSelectedLayerId = (state: MapState, payload: ReturnType<typeof MapActions.setSelectedLayerId>): MapState => ({
  ...state,
  selectedLayer: payload.layerId,
});

const onToggleLevelExpansion = (state: MapState, payload: ReturnType<typeof MapActions.toggleLevelExpansion>): MapState => {
  const idx = state.layerTreeNodes.findIndex(l => l.id === payload.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    layerTreeNodes: [
      ...state.layerTreeNodes.slice(0, idx),
      { ...state.layerTreeNodes[idx], expanded: !state.layerTreeNodes[idx].expanded },
      ...state.layerTreeNodes.slice(idx + 1),
    ],
  };
};

const onAddServices = (state: MapState, payload: ReturnType<typeof MapActions.addServices>): MapState => ({
  ...state,
  services: [ ...state.services, ...payload.services ],
});

const onAddAppLayers = (state: MapState, payload: ReturnType<typeof MapActions.addAppLayers>): MapState => ({
  ...state,
  layers: [ ...state.layers, ...payload.appLayers ],
});

const onAddLayerTreeNodes = (state: MapState, payload: ReturnType<typeof MapActions.addLayerTreeNodes>): MapState => ({
  ...state,
  layerTreeNodes: [ ...state.layerTreeNodes, ...payload.layerTreeNodes.map(LayerTreeNodeHelper.getExtendedLayerTreeNode) ],
});

const onMoveLayerTreeNode = (state: MapState, payload: ReturnType<typeof MapActions.moveLayerTreeNode>): MapState => {
  const newParentIdx = payload.parentId
    ? state.layerTreeNodes.findIndex(n => n.id === payload.parentId)
    : state.layerTreeNodes.findIndex(n => n.root);
  const currentParentIdx = state.layerTreeNodes.findIndex(n => n.childrenIds.includes(payload.nodeId));
  return {
    ...state,
    layerTreeNodes: state.layerTreeNodes.map((node, idx) => {
      if (newParentIdx === idx) {
        return {
          ...node,
          childrenIds: typeof payload.index !== 'undefined' ? [
            ...node.childrenIds.slice(0, payload.index),
            payload.nodeId,
            ...node.childrenIds.slice(payload.index + 1),
          ] : [ ...node.childrenIds, payload.nodeId ],
        };
      }
      if (currentParentIdx === idx) {
        return {
          ...node,
          childrenIds: node.childrenIds.filter(id => id !== payload.nodeId),
        };
      }
      return node;
    }),
  };
};

const mapReducerImpl = createReducer<MapState>(
  initialMapState,
  on(MapActions.loadMap, onLoadMap),
  on(MapActions.loadMapSuccess, onLoadMapSuccess),
  on(MapActions.loadMapFailed, onLoadMapFailed),
  on(MapActions.setLayerVisibility, onSetLayerVisibility),
  on(MapActions.toggleLevelExpansion, onToggleLevelExpansion),
  on(MapActions.setSelectedLayerId, onSetSelectedLayerId),
  on(MapActions.addServices, onAddServices),
  on(MapActions.addAppLayers, onAddAppLayers),
  on(MapActions.addLayerTreeNodes, onAddLayerTreeNodes),
  on(MapActions.moveLayerTreeNode, onMoveLayerTreeNode),
);
export const mapReducer = (state: MapState | undefined, action: Action) => mapReducerImpl(state, action);
