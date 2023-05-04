import * as CatalogActions from './catalog.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CatalogState, initialCatalogState } from './catalog.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { CatalogModelHelper } from '../helpers/catalog-model.helper';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';

type ExpandableNode = { id: string; children?: string[] | null; expanded?: boolean };

const findParentsForExpansion = (list: ExpandableNode[], nodeId: string) => {
  const shouldExpand = !list.find(n => n.id === nodeId)?.expanded;
  if (!shouldExpand) {
    return [];
  }
  return CatalogTreeHelper.findParentsForNode(list, nodeId);
};

const expandNode = <T extends ExpandableNode>(list: T[], nodeId: string, forceExpand?: boolean): T[] => {
  const parentIds = findParentsForExpansion(list, nodeId);
  return list.map<T>(node => {
    let expanded = node.id === nodeId
      ? (typeof forceExpand === 'boolean' ? forceExpand : !node.expanded)
      : node.expanded;
    if (parentIds.includes(node.id)) {
      expanded = true;
    }
    return { ...node, expanded };
  });
};

const addFeatureSources = (state: CatalogState, featureSources: FeatureSourceModel[], catalogNodeId: string) => {
  const featureTypes: ExtendedFeatureTypeModel[] = [];
  const extendedFeatureSources: ExtendedFeatureSourceModel[] = [];
  featureSources.forEach(source => {
    const [ extFeatureSource, sourceFeatureTypes ] = CatalogModelHelper.getExtendedFeatureSource(source, catalogNodeId);
    extendedFeatureSources.push(extFeatureSource);
    featureTypes.push(...sourceFeatureTypes);
  });
  return {
    ...state,
    featureSources: [ ...state.featureSources, ...extendedFeatureSources ],
    featureTypes: [ ...state.featureTypes, ...featureTypes ],
  };
};


const onLoadCatalogStart = (state: CatalogState): CatalogState => ({
  ...state,
  catalogLoadStatus: LoadingStateEnum.LOADING,
  catalogLoadError: undefined,
  catalog: [],
});

const onLoadCatalogsSuccess = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.loadCatalogSuccess>,
): CatalogState => ({
  ...state,
  catalogLoadStatus: LoadingStateEnum.LOADED,
  catalogLoadError: undefined,
  catalog: payload.nodes.map(node => ({
    ...node,
    parentId: payload.nodes.find(n => (n.children || []).includes(node.id))?.id || null,
  })),
});

const onLoadCatalogsFailed = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.loadCatalogFailed>,
): CatalogState => ({
  ...state,
  catalogLoadStatus: LoadingStateEnum.FAILED,
  catalogLoadError: payload.error,
  catalog: [],
});

const onAddGeoServices = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addGeoServices>,
): CatalogState => {
  const layerModels: ExtendedGeoServiceLayerModel[] = [];
  const services: ExtendedGeoServiceModel[] = [];
  payload.services.forEach(service => {
    const [ extService, serviceLayers ] = CatalogModelHelper.getExtendedGeoService(service, payload.parentNode);
    services.push(extService);
    layerModels.push(...serviceLayers);
  });
  return {
    ...state,
    geoServices: [ ...state.geoServices, ...services ],
    geoServiceLayers: [ ...state.geoServiceLayers, ...layerModels ],
  };
};

const onUpdateGeoService = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateGeoService>,
): CatalogState => {
  const serviceId = `${payload.service.id}`;
  const currentLayers = state.geoServiceLayers.filter(layer => layer.serviceId === serviceId);
  const currentService = state.geoServices.find(service => service.id === serviceId);
  const layers = state.geoServiceLayers.filter(layer => layer.serviceId !== serviceId);
  const services = state.geoServices.filter(service => service.id !== serviceId);
  const [ extendedService, serviceLayers ] = CatalogModelHelper.getExtendedGeoService(payload.service, payload.parentNode);
  const updatedLayers = serviceLayers.map(layer => {
    const currentLayer = currentLayers.find(l => l.id === layer.id);
    return { ...layer, expanded: currentLayer?.expanded || false };
  });
  const updatedService = { ...extendedService, expanded: currentService?.expanded || false };
  return {
    ...state,
    geoServices: [ ...services, updatedService ],
    geoServiceLayers: [ ...layers, ...updatedLayers ],
  };
};

const onDeleteGeoService = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.deleteGeoService>,
): CatalogState => {
  const layers = state.geoServiceLayers.filter(layer => layer.serviceId !== payload.id);
  const services = state.geoServices.filter(service => service.id !== payload.id);
  return {
    ...state,
    geoServices: services,
    geoServiceLayers: layers,
  };
};

const onAddFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addFeatureSources>,
): CatalogState => addFeatureSources(state, payload.featureSources, payload.parentNode);

const onUpdateFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateFeatureSource>,
): CatalogState => {
  const [ updatedFeatureSource, updatedFeatureTypes ] = CatalogModelHelper.getExtendedFeatureSource(payload.featureSource, payload.parentNode);
  const idx = state.featureSources.findIndex(f => f.id === updatedFeatureSource.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    featureSources: [
      ...state.featureSources.slice(0, idx),
      { ...updatedFeatureSource, expanded: state.featureSources[idx]?.expanded ?? false, catalogNodeId: payload.parentNode },
      ...state.featureSources.slice(idx + 1),
    ],
    featureTypes: [
      ...state.featureTypes.filter(f => f.featureSourceId !== updatedFeatureSource.id),
      ...updatedFeatureTypes,
    ],
  };
};

const onDeleteFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.deleteFeatureSource>,
): CatalogState => {
  const idx = state.featureSources.findIndex(f => f.id === payload.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    featureSources: [
      ...state.featureSources.slice(0, idx),
      ...state.featureSources.slice(idx + 1),
    ],
  };
};

const onExpandTree = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.expandTree>,
): CatalogState => {
  if (payload.nodeType === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE) {
    return { ...state, catalog: expandNode(state.catalog, payload.id) };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.SERVICE_TYPE) {
    const service = state.geoServices.find(s => s.id === payload.id);
    return {
      ...state,
      geoServices: expandNode(state.geoServices, payload.id),
      catalog: service && !service.expanded ? expandNode(state.catalog, service.catalogNodeId, true) : state.catalog,
    };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE) {
    const layer = state.geoServiceLayers.find(l => l.id === payload.id);
    return {
      ...state,
      geoServiceLayers: expandNode(state.geoServiceLayers, payload.id),
      geoServices: layer && !layer.expanded ? expandNode(state.geoServices, layer.serviceId, true) : state.geoServices,
      catalog: layer && !layer.expanded ? expandNode(state.catalog, layer.catalogNodeId, true) : state.catalog,
    };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE) {
    const featureSource = state.featureSources.find(f => f.id === payload.id);
    return {
      ...state,
      featureSources: expandNode(state.featureSources, payload.id),
      catalog: featureSource && !featureSource.expanded ? expandNode(state.catalog, featureSource.catalogNodeId, true) : state.catalog,
    };
  }
  return state;
};

const onUpdateCatalog = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateCatalog>,
): CatalogState => {
  const currentCatalog: Map<string, ExtendedCatalogNodeModel> = new Map(state.catalog.map(node => [ node.id, node ]));
  return {
    ...state,
    catalog: payload.nodes.map<ExtendedCatalogNodeModel>(node => ({
      ...node,
      expanded: currentCatalog.get(node.id)?.expanded || false,
      parentId: payload.nodes.find(n => (n.children || []).includes(node.id))?.id || null,
    })),
  };
};

const onLoadFeatureSourceStart = (
  state: CatalogState,
): CatalogState => ({
  ...state,
  featureSourcesLoadStatus: LoadingStateEnum.LOADING,
});

const onLoadFeatureSourcesSuccess = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.loadFeatureSourcesSuccess>,
): CatalogState => ({
  ...addFeatureSources(state, payload.featureSources, ''),
  featureSourcesLoadStatus: LoadingStateEnum.LOADED,
});

const onLoadFeatureSourcesFailed = (
  state: CatalogState,
): CatalogState => ({
  ...state,
  featureSourcesLoadStatus: LoadingStateEnum.FAILED,
});

const onUpdateFeatureSourceNodeIds = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateFeatureSourceNodeIds>,
): CatalogState => {
  const featureSourceIds = new Set(payload.featureSources);
  return {
    ...state,
    featureSources: state.featureSources.map(source => ({
      ...source,
      catalogNodeId: featureSourceIds.has(source.id) ? payload.nodeId : source.catalogNodeId,
    })),
    featureTypes: state.featureTypes.map(type => ({
      ...type,
      catalogNodeId: featureSourceIds.has(type.featureSourceId) ? payload.nodeId : type.catalogNodeId,
    })),
  };
};

const onUpdateGeoServiceNodeIds = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateGeoServiceNodeIds>,
): CatalogState => {
  const geoServiceIds = new Set(payload.geoServices);
  return {
    ...state,
    geoServices: state.geoServices.map(source => ({
      ...source,
      catalogNodeId: geoServiceIds.has(source.id) ? payload.nodeId : source.catalogNodeId,
    })),
    geoServiceLayers: state.geoServiceLayers.map(layer => ({
      ...layer,
      catalogNodeId: geoServiceIds.has(layer.serviceId) ? payload.nodeId : layer.catalogNodeId,
    })),
  };
};

const catalogReducerImpl = createReducer<CatalogState>(
  initialCatalogState,
  on(CatalogActions.loadCatalogStart, onLoadCatalogStart),
  on(CatalogActions.loadCatalogSuccess, onLoadCatalogsSuccess),
  on(CatalogActions.loadCatalogFailed, onLoadCatalogsFailed),
  on(CatalogActions.addGeoServices, onAddGeoServices),
  on(CatalogActions.updateGeoService, onUpdateGeoService),
  on(CatalogActions.deleteGeoService, onDeleteGeoService),
  on(CatalogActions.addFeatureSources, onAddFeatureSource),
  on(CatalogActions.updateFeatureSource, onUpdateFeatureSource),
  on(CatalogActions.deleteFeatureSource, onDeleteFeatureSource),
  on(CatalogActions.expandTree, onExpandTree),
  on(CatalogActions.updateCatalog, onUpdateCatalog),
  on(CatalogActions.loadFeatureSourcesStart, onLoadFeatureSourceStart),
  on(CatalogActions.loadFeatureSourcesSuccess, onLoadFeatureSourcesSuccess),
  on(CatalogActions.loadFeatureSourcesFailed, onLoadFeatureSourcesFailed),
  on(CatalogActions.updateFeatureSourceNodeIds, onUpdateFeatureSourceNodeIds),
  on(CatalogActions.updateGeoServiceNodeIds, onUpdateGeoServiceNodeIds),
);
export const catalogReducer = (state: CatalogState | undefined, action: Action) => catalogReducerImpl(state, action);

