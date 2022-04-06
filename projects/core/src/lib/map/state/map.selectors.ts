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
    selectMapState,
    selectServices,
    (state, services: ServiceModel[]) => getLayersAndServices(state.layers, services),
);

export const selectVisibleLayers = createSelector(
    selectLayersAndServices,
    layers => layers.filter(l => l.layer.visible),
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

const findLayerTreeNode = (layerTreeNodes: LayerTreeNodeModel[], id: string) => layerTreeNodes.find(l => l.id === id);
const findLayerIds = (layerTreeNodes: LayerTreeNodeModel[], child?: LayerTreeNodeModel): number[] => {
  const childIds = (child?.childrenIds || []).map(id => findLayerIds(layerTreeNodes, findLayerTreeNode(layerTreeNodes, id)));
  return (child?.appLayerId ? [child.appLayerId] : []).concat(...childIds);
};

export const selectOrderedLayerIds = createSelector(
  selectLayerTreeNodes,
  layerTreeNodes => findLayerIds(layerTreeNodes, layerTreeNodes.find(l => l.root)),
);

export const selectOrderedVisibleLayers = createSelector(
  selectVisibleLayers,
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.layer.id))
      .sort(l => orderedLayerIds.findIndex(id => l.layer.id === id));
  },
);

const traverseTree = <T>(
  layerTreeNodes: ExtendedLayerTreeNodeModel[],
  id: string,
  transformer: (node: ExtendedLayerTreeNodeModel, children: T[]) => T | null): T | null => {
  const node = findLayerTreeNode(layerTreeNodes, id);
  if (!node) {
    return null;
  }
  const children = node.childrenIds
    .map(childId => traverseTree(layerTreeNodes, childId, transformer))
    .filter<T>((n: T | null): n is T => !!n);
  return transformer(node, children);
};

export const selectLayerTree = createSelector(
  selectLayerTreeNodes,
  selectLayers,
  (layerTreeNodes, layers): TreeModel[] => {
    const root = layerTreeNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    const tree = traverseTree<TreeModel<AppLayerModel>>(
        layerTreeNodes,
        root.id,
      (node, children) => ({
          ...LayerTreeNodeHelper.getTreeModelForLayerTreeNode(node, layers),
          children,
        }),
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return tree.children || [];
  },
);
