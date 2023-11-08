import { MapSettingsModel, MapState, mapStateKey } from './map.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppLayerModel, LayerDetailsModel, LayerTreeNodeModel, ServerType, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import { ArrayHelper, TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { LayerTreeNodeHelper } from '../helpers/layer-tree-node.helper';
import { ExtendedAppLayerModel, ExtendedLayerTreeNodeModel, AppLayerWithInitialValuesModel } from '../models';

const selectMapState = createFeatureSelector<MapState>(mapStateKey);

export const selectServices = createSelector(selectMapState, state => state.services);
export const selectLayers = createSelector(selectMapState, state => state.layers);
export const selectSelectedLayerId = createSelector(selectMapState, state => state.selectedLayer);
export const selectMapSettings = createSelector(selectMapState, state => state.mapSettings);
export const selectLayerTreeNodes = createSelector(selectMapState, state => state.layerTreeNodes);
export const selectBackgroundLayerTreeNodes = createSelector(selectMapState, state => state.baseLayerTreeNodes);
export const selectSelectedBackgroundNodeId = createSelector(selectMapState, state => state.selectedBackgroundNode);
export const selectLoadStatus = createSelector(selectMapState, state => state.loadStatus);
export const selectLayerDetailsAll = createSelector(selectMapState, state => state.layerDetails);

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
        service: services.find(s => s.id === layer.serviceId),
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

export const selectOrderedLayerNodes = createSelector(
  selectLayerTreeNodes,
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(node => LayerTreeNodeHelper.isAppLayerNode(node))
      .sort(ArrayHelper.getArraySorter('appLayerId', orderedLayerIds));
  },
);

export const selectOrderedBackgroundLayerIds = createSelector(
  selectBackgroundLayerTreeNodes,
  baseLayerTreeNodes => LayerTreeNodeHelper.getAppLayerIds(baseLayerTreeNodes, baseLayerTreeNodes.find(l => l.root)),
);

export const selectOrderedVisibleLayersWithServices = createSelector(
  selectVisibleLayersWithServices,
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.id))
      .sort(ArrayHelper.getArraySorter('id', orderedLayerIds));
  },
);

export const selectVisibleLayersWithAttributes = createSelector(
  selectOrderedVisibleLayersWithServices,
  layers => layers.filter(l => l.hasAttributes),
);

export const selectEditableLayers = createSelector(
  selectOrderedVisibleLayersWithServices,
  layers => layers.filter(l => l.editable),
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
  selectOrderedLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.id))
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
  selectOrderedBackgroundLayerIds,
  (layers, orderedLayerIds) => {
    return layers
      .filter(l => orderedLayerIds.includes(l.id))
      .sort(ArrayHelper.getArraySorter('id', orderedLayerIds));
  },
);

export const selectLayersMap = createSelector(
  selectLayers,
  (layers): Map<string, AppLayerWithInitialValuesModel> => new Map(layers.map(l => [ l.id, l ])),
);

export const selectLayerTree = createSelector(
  selectLayerTreeNodes,
  selectLayersMap,
  (layerTreeNodes, layers): TreeModel[] => LayerTreeNodeHelper.layerTreeNodeToTree(layerTreeNodes, layers),
);

export const selectBackgroundLayerTree = createSelector(
  selectBackgroundLayerTreeNodes,
  selectLayersMap,
  (layerTreeNodes, layers): TreeModel[] => LayerTreeNodeHelper.layerTreeNodeToTree(layerTreeNodes, layers),
);

export const selectBackgroundNodesListWithTitle = createSelector(
  selectBackgroundLayerTreeNodes,
  selectLayers,
  (treeNodes: ExtendedLayerTreeNodeModel[], layers): ExtendedLayerTreeNodeModel[] => {
    return treeNodes
      .map(node => ({
        ...node,
        name: node.appLayerId ? layers.find(l => l.id === node.appLayerId)?.title || node.name : node.name,
      }));
  },
);

export const selectBackgroundNodesList = createSelector(
  selectBackgroundNodesListWithTitle,
  (treeNodes: ExtendedLayerTreeNodeModel[]): ExtendedLayerTreeNodeModel[] => {
    const root = treeNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    return (root.childrenIds || [])
      .map(childId => TreeHelper.findNode(treeNodes, childId))
      .filter((node: ExtendedLayerTreeNodeModel | undefined): node is ExtendedLayerTreeNodeModel => typeof node !== 'undefined');
  },
);

export const selectInitiallySelectedBackgroundNodes = createSelector(
  selectBackgroundNodesListWithTitle,
  selectLayersMap,
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

export const selectLayer = (layerId: string) => createSelector(
  selectLayers,
  (layers: AppLayerWithInitialValuesModel[]) => layers.find(l => l.id === layerId) || null,
);

export const selectLayerDetails = (layerId: string) => createSelector(
  selectLayerDetailsAll,
  (details: LayerDetailsModel[]) => details.find(l => l.id === layerId) || null,
);

export const selectLayerWithService = (layerId: string) => createSelector(
  selectLayersWithServices,
  (layers: ExtendedAppLayerModel[]) => layers.find(l => l.id === layerId) || null,
);

export const selectLayerOpacity = (layerId: string) => createSelector(
  selectLayer(layerId),
  (layer) => layer?.opacity || 100,
);

export const selectFullLayerDetails = (layerId: string) => createSelector(
  selectLayer(layerId),
  selectLayerDetails(layerId),
  (layer, details) => {
    if (!layer) {
      return null;
    }
    return {
      layer,
      details,
    };
  },
);
