import { MapSettingsModel, MapState, mapStateKey } from './map.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppLayerModel, LayerTreeNodeModel, ServerType, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import { ArrayHelper, TreeModel } from '@tailormap-viewer/shared';
import { LayerTreeNodeHelper } from '../helpers/layer-tree-node.helper';
import { ExtendedAppLayerModel, ExtendedLayerTreeNodeModel, AppLayerWithInitialValuesModel } from '../models';

const selectMapState = createFeatureSelector<MapState>(mapStateKey);

export const selectServices = createSelector(selectMapState, state => state.services);
export const selectLayers = createSelector(selectMapState, state => state.layers);
export const selectSelectedLayerName = createSelector(selectMapState, state => state.selectedLayer);
export const selectMapSettings = createSelector(selectMapState, state => state.mapSettings);
export const selectLayerTreeNodes = createSelector(selectMapState, state => state.layerTreeNodes);
export const selectBackgroundLayerTreeNodes = createSelector(selectMapState, state => state.baseLayerTreeNodes);
export const selectSelectedBackgroundNodeId = createSelector(selectMapState, state => state.selectedBackgroundNode);
export const selectLoadStatus = createSelector(selectMapState, state => state.loadStatus);

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

export const selectLayerTreeNode = (nodeId: string) => createSelector(
  selectLayerTreeNodes,
  (layerTreeNodes?: LayerTreeNodeModel[]) => (layerTreeNodes || []).find(node => node.id === nodeId) || null,
);

const getLayersWithServices = (layers: AppLayerWithInitialValuesModel[], services: ServiceModel[]): ExtendedAppLayerModel[] => {
    return layers.map(layer => ({
        ...layer,
        service: services.find(s => s.name === layer.serviceName),
    }));
};

// Note: this includes the background layers
export const selectLayersWithServices = createSelector(
  selectLayers,
  selectServices,
  (layers, services: ServiceModel[]) => getLayersWithServices(layers, services),
);

export const selectVisibleLayersWithServices = createSelector(
    selectLayersWithServices,
    layers => layers.filter(l => l.visible),
);

export const selectSelectedLayer = createSelector(
    selectSelectedLayerName,
    selectLayers,
    (selectedId, layers): AppLayerModel | null => {
        if (typeof selectedId === 'undefined') {
            return null;
        }
        return layers.find(l => l.name === selectedId) || null;
    },
);

export const selectOrderedLayerNames = createSelector(
  selectLayerTreeNodes,
  layerTreeNodes => LayerTreeNodeHelper.getAppLayerNames(layerTreeNodes, layerTreeNodes.find(l => l.root)),
);

export const selectOrderedLayerNodes = createSelector(
  selectLayerTreeNodes,
  selectOrderedLayerNames,
  (layers, orderedLayerNames) => {
    return layers
      .filter(node => LayerTreeNodeHelper.isAppLayerNode(node))
      .sort(ArrayHelper.getArraySorter('appLayerName', orderedLayerNames));
  },
);

export const selectOrderedBackgroundLayerNames = createSelector(
  selectBackgroundLayerTreeNodes,
  baseLayerTreeNodes => LayerTreeNodeHelper.getAppLayerNames(baseLayerTreeNodes, baseLayerTreeNodes.find(l => l.root)),
);

export const selectOrderedVisibleLayersWithServices = createSelector(
  selectVisibleLayersWithServices,
  selectOrderedLayerNames,
  (layers, orderedLayerNames) => {
    return layers
      .filter(l => orderedLayerNames.includes(l.name))
      .sort(ArrayHelper.getArraySorter('name', orderedLayerNames));
  },
);

export const selectVisibleLayersWithAttributes = createSelector(
  selectOrderedVisibleLayersWithServices,
  layers => layers.filter(l => l.hasAttributes),
);

export const selectVisibleWMSLayersWithoutAttributes = createSelector(
  selectOrderedVisibleLayersWithServices,
  layers => layers.filter(l => l.service?.protocol === ServiceProtocol.WMS && !l.hasAttributes),
);

export const selectFilterableLayers = createSelector(
  selectOrderedVisibleLayersWithServices,
  layers => layers.filter(l => l.service?.serverType === ServerType.GEOSERVER),
);

export const selectSomeLayersVisible = createSelector(
  selectLayers,
  selectOrderedLayerNames,
  (layers, orderedLayerNames) => {
    return layers
      .filter(l => orderedLayerNames.includes(l.name))
      .some(l => l.visible);
  },
);

// Only layers for which a legend can be shown at the moment: has a legendImageUrl set or is a WMS/WMTS layer
// In the future, more layer types could be added but without immediate legend support.
export const selectOrderedVisibleLayersWithLegend = createSelector(
  selectOrderedVisibleLayersWithServices,
  (layers) => layers.filter(layer => layer.legendImageUrl || layer.service && [ ServiceProtocol.WMS, ServiceProtocol.WMTS ].includes(layer.service.protocol)),
);

export const selectOrderedVisibleBackgroundLayers = createSelector(
  selectVisibleLayersWithServices,
  selectOrderedBackgroundLayerNames,
  (layers, orderedLayerNames) => {
    return layers
      .filter(l => orderedLayerNames.includes(l.name))
      .sort(ArrayHelper.getArraySorter('name', orderedLayerNames));
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
  (treeNodes: ExtendedLayerTreeNodeModel[]): ExtendedLayerTreeNodeModel[] => {
    const root = treeNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    return (root.childrenIds ?? [])
      .map(childId => LayerTreeNodeHelper.findLayerTreeNode(treeNodes, childId))
      .filter((node: ExtendedLayerTreeNodeModel| undefined): node is ExtendedLayerTreeNodeModel => typeof node !== 'undefined');
  },
);

export const selectInitiallySelectedBackgroundNodes = createSelector(
  selectBackgroundLayerTreeNodes,
  selectLayers,
  (layerTreeNodes, layers): LayerTreeNodeModel[] => LayerTreeNodeHelper.getSelectedTreeNodes(layerTreeNodes, layers),
);

export const selectSelectedNode = createSelector(
  selectSelectedLayerName,
  selectLayerTreeNodes,
  (selectedLayerName, treeNodes) => {
    if (!selectedLayerName) {
      return '';
    }
    const layerTreeNode = treeNodes.find(node => !!node.appLayerName && node.appLayerName === selectedLayerName);
    return layerTreeNode ? layerTreeNode.id : '';
  });

export const selectLayer = (layerName: string) => createSelector(
  selectLayers,
  (layers: AppLayerWithInitialValuesModel[]) => layers.find(l => l.name === layerName) || null,
);

export const selectLayerWithService = (layerName: string) => createSelector(
  selectLayersWithServices,
  (layers: ExtendedAppLayerModel[]) => layers.find(l => l.name === layerName) || null,
);

export const selectLayerOpacity = (layerName: string) => createSelector(
  selectLayer(layerName),
  (layer) => layer?.opacity || 100,
);
