import { MapSettingsModel, MapState, mapStateKey } from './map.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppLayerModel, LayerTreeNodeModel, ServiceModel } from '@tailormap-viewer/api';
import { TreeModel } from '@tailormap-viewer/shared';
import { LayerTreeNodeHelper } from '../helpers/layer-tree-node.helper';
import { ExtendedLayerTreeNodeModel } from '../models';

const selectMapState = createFeatureSelector<MapState>(mapStateKey);

export const selectServices = createSelector(selectMapState, state => state.services);
export const selectLayers = createSelector(selectMapState, state => state.layers);
export const selectSelectedLayerId = createSelector(selectMapState, state => state.selectedLayer);
export const selectMapSettings = createSelector(selectMapState, state => state.mapSettings);
export const selectLayerTreeNodes = createSelector(selectMapState, state => state.layerTreeNodes);
export const selectBackgroundLayerTreeNodes = createSelector(selectMapState, state => state.baseLayerTreeNodes);
export const selectSelectedBackgroundNodeId = createSelector(selectMapState, state => state.selectedBackgroundNode);

export const selectMapOptions = createSelector(
  selectMapSettings,
  (mapSettings?: MapSettingsModel) => {
    if (!mapSettings || !mapSettings.crs) {
      return null;
    }
    return {
      projection: mapSettings.crs.code,
      projectionDefinition: mapSettings.crs.definition,
      maxExtent: mapSettings?.maxExtent ? [
        mapSettings?.maxExtent.minx,
        mapSettings?.maxExtent.miny,
        mapSettings?.maxExtent.maxx,
        mapSettings?.maxExtent.maxy,
      ] : [],
      initialExtent: mapSettings?.initialExtent ? [
        mapSettings?.initialExtent.minx,
        mapSettings?.initialExtent.miny,
        mapSettings?.initialExtent.maxx,
        mapSettings?.initialExtent.maxy,
      ] : [],
    };
  },
);

const getLayersAndServices = (layers: AppLayerModel[], services: ServiceModel[]) => {
    return layers.map(layer => ({
        layer,
        service: services.find(s => s.id === layer.serviceId),
    }));
};

export const selectLayersAndServices = createSelector(
  selectLayers,
  selectServices,
  (layers, services: ServiceModel[]) => getLayersAndServices(layers, services),
);

export const selectVisibleLayersAndServices = createSelector(
    selectLayersAndServices,
    layers => layers.filter(l => l.layer.visible),
);

export const selectVisibleLayers = createSelector(
  selectLayers,
  layers => layers.filter(l => l.visible),
);

export const selectVisibleLayersWithAttributes = createSelector(
  selectVisibleLayers,
  layers => layers.filter(l => l.hasAttributes),
);

export const selectSelectedLayer = createSelector(
    selectSelectedLayerId,
    selectLayers,
    (selectedId, layers): AppLayerModel | null => {
        if (typeof selectedId === 'undefined') {
            return null;
        }
        return layers.find(l => l.id === selectedId) || null;
    },
);

export const selectOrderedLayerIds = createSelector(
  selectLayerTreeNodes,
  layerTreeNodes => LayerTreeNodeHelper.getAppLayerIds(layerTreeNodes, layerTreeNodes.find(l => l.root)),
);

export const selectOrderedBackgroundLayerIds = createSelector(
  selectBackgroundLayerTreeNodes,
  baseLayerTreeNodes => LayerTreeNodeHelper.getAppLayerIds(baseLayerTreeNodes, baseLayerTreeNodes.find(l => l.root)),
);

export const selectOrderedVisibleLayers = createSelector(
  selectVisibleLayers,
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.id))
      .sort(l => orderedLayerIds.findIndex(id => l.id === id));
  },
);

export const selectOrderedVisibleLayersAndServices = createSelector(
  selectVisibleLayersAndServices,
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.layer.id))
      .sort(l => orderedLayerIds.findIndex(id => l.layer.id === id));
  },
);

export const selectOrderedVisibleBackgroundLayers = createSelector(
  selectVisibleLayersAndServices,
  selectOrderedBackgroundLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.layer.id))
      .sort(l => orderedLayerIds.findIndex(id => l.layer.id === id));
  },
);

export const selectLayerTree = createSelector(
  selectLayerTreeNodes,
  selectLayers,
  (layerTreeNodes, layers): TreeModel[] => LayerTreeNodeHelper.layerTreeNodeToTree(layerTreeNodes, layers),
);

export const selectBackgroundLayerTree = createSelector(
  selectBackgroundLayerTreeNodes,
  selectLayers,
  (layerTreeNodes, layers): TreeModel[] => LayerTreeNodeHelper.layerTreeNodeToTree(layerTreeNodes, layers),
);

export const selectBackgroundNodesList = createSelector(
  selectBackgroundLayerTreeNodes,
  (treeNodes: ExtendedLayerTreeNodeModel[]): LayerTreeNodeModel[] => {
    const root = treeNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    return (root.childrenIds || [])
      .map(childId => LayerTreeNodeHelper.findLayerTreeNode(treeNodes, childId))
      .filter((node: LayerTreeNodeModel | undefined): node is LayerTreeNodeModel => typeof node !== 'undefined');
  },
);

export const selectInitiallySelectedBackgroundNodes = createSelector(
  selectBackgroundLayerTreeNodes,
  selectLayers,
  (layerTreeNodes, layers): LayerTreeNodeModel[] => LayerTreeNodeHelper.getSelectedTreeNodes(layerTreeNodes, layers),
);

export const selectSelectedNode = createSelector(
  selectSelectedLayerId,
  selectLayerTreeNodes,
  (selectedLayerId, treeNodes) => {
    if (!selectedLayerId) {
      return '';
    }
    const layerTreeNode = treeNodes.find(node => !!node.appLayerId && node.appLayerId === selectedLayerId);
    return layerTreeNode ? layerTreeNode.id : '';
  });
