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
  const tree: keyof MapState = payload.isBaseLayerTree ? 'baseLayerTreeNodes' : 'layerTreeNodes';
  const idx = state[tree].findIndex(l => l.id === payload.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    [tree]: [
      ...state[tree].slice(0, idx),
      { ...state[tree][idx], expanded: !state[tree][idx].expanded },
      ...state[tree].slice(idx + 1),
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

const onAddLayerTreeNodes = (state: MapState, payload: ReturnType<typeof MapActions.addLayerTreeNodes>): MapState => {
  const tree: keyof MapState = payload.isBaseLayerTree ? 'baseLayerTreeNodes' : 'layerTreeNodes';
  return {
    ...state,
    [tree]: [...state[tree], ...payload.layerTreeNodes.map(LayerTreeNodeHelper.getExtendedLayerTreeNode)],
  };
};

const onMoveLayerTreeNode = (state: MapState, payload: ReturnType<typeof MapActions.moveLayerTreeNode>): MapState => {
  const tree: keyof MapState = payload.isBaseLayerTree ? 'baseLayerTreeNodes' : 'layerTreeNodes';
  const newParentIdx = payload.parentId
    ? state[tree].findIndex(n => n.id === payload.parentId)
    : state[tree].findIndex(n => n.root);
  const currentParentIdx = state[tree].findIndex(n => n.childrenIds.includes(payload.nodeId));
  return {
    ...state,
    [tree]: state[tree].map((node, idx) => {
      if (newParentIdx === idx) {
        let pos = typeof payload.beforeNodeId !== 'undefined'
          ? node.childrenIds.indexOf(payload.beforeNodeId)
          : -1;
        if (pos === -1) {
          pos = node.childrenIds.length;
        }
        return {
          ...node,
          childrenIds: [
            ...node.childrenIds.slice(0, pos),
            payload.nodeId,
            ...node.childrenIds.slice(pos),
          ],
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

const onSetSelectedBackgroundNodeId = (state: MapState, payload: ReturnType<typeof MapActions.setSelectedBackgroundNodeId>): MapState => ({
  ...state,
  layers: state.layers.map(layer => {
    const parent = LayerTreeNodeHelper.getTopParent(state.baseLayerTreeNodes, layer);
    return {
      ...layer,
      visible: typeof parent === 'undefined'
        ? layer.visible
        : parent.id === payload.id,
    };
  }),
  selectedBackgroundNode: payload.id,
});

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
  on(MapActions.setSelectedBackgroundNodeId, onSetSelectedBackgroundNodeId),
);
export const mapReducer = (state: MapState | undefined, action: Action) => mapReducerImpl(state, action);
