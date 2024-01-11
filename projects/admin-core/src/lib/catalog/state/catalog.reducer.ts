import * as CatalogActions from './catalog.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CatalogState, initialCatalogState } from './catalog.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { ExtendedCatalogModelHelper } from '../helpers/extended-catalog-model.helper';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { CatalogItemKindEnum, FeatureSourceModel, GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';

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

const getParentNode = (state: CatalogState, type: CatalogItemKindEnum, id: string) => {
  const parentNode = state.catalog.find(node => {
    return (node.items || [])
      .some(item => item.kind === type && item.id === `${id}`);
  });
  return parentNode?.id || '';
};

const addFeatureSources = (
  state: CatalogState,
  featureSources: FeatureSourceModel[],
  catalogNodeId?: string,
) => {
  const featureTypes: ExtendedFeatureTypeModel[] = [];
  const extendedFeatureSources: ExtendedFeatureSourceModel[] = [];
  const existingFeatureSources = new Set(state.featureSources.map(s => s.id));
  const sources = featureSources.filter(source => !existingFeatureSources.has(`${source.id}`));
  sources.forEach(source => {
    const parentId = catalogNodeId || getParentNode(state, CatalogItemKindEnum.FEATURE_SOURCE, source.id);
    const [ extFeatureSource, sourceFeatureTypes ] = ExtendedCatalogModelHelper.getExtendedFeatureSource(source, parentId);
    extendedFeatureSources.push(extFeatureSource);
    featureTypes.push(...sourceFeatureTypes);
  });
  return {
    ...state,
    featureSources: [ ...state.featureSources, ...extendedFeatureSources ],
    featureTypes: [ ...state.featureTypes, ...featureTypes ],
  };
};

const addGeoServices = (
  state: CatalogState,
  newServices: GeoServiceWithLayersModel[],
  parentNode?: string,
) => {
  const layerModels: ExtendedGeoServiceLayerModel[] = [];
  const services: ExtendedGeoServiceModel[] = [];
  const existingServices = new Set(state.geoServices.map(s => s.id));
  const filteredServices = newServices.filter(s => !existingServices.has(s.id));
  filteredServices
    .forEach(service => {
      const parentId = parentNode || getParentNode(state, CatalogItemKindEnum.GEO_SERVICE, service.id);
      const [ extService, serviceLayers ] = ExtendedCatalogModelHelper.getExtendedGeoService(service, parentId);
      services.push(extService);
      layerModels.push(...serviceLayers);
    });
  return {
    ...state,
    geoServices: [ ...state.geoServices, ...services ],
    geoServiceLayers: [ ...state.geoServiceLayers, ...layerModels ],
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

const onLoadAllGeoServicesStart = (state: CatalogState): CatalogState => ({
  ...state,
  geoServicesLoadStatus: LoadingStateEnum.LOADING,
});

const onLoadAllGeoServicesSuccess = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.loadAllGeoServicesSuccess>,
): CatalogState => {
  const updatedState = addGeoServices(state, payload.services);
  return {
    ...state,
    ...updatedState,
    geoServicesLoadStatus: LoadingStateEnum.LOADED,
  };
};

const onLoadAllGeoServicesFailed = (state: CatalogState): CatalogState => ({
  ...state,
  geoServicesLoadStatus: LoadingStateEnum.FAILED,
});

const onAddGeoServices = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addGeoServices>,
): CatalogState => {
  return addGeoServices(state, payload.services, payload.parentNode);
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
  const parentId = payload.parentNode || getParentNode(state, CatalogItemKindEnum.GEO_SERVICE, payload.service.id);
  const [ extendedService, serviceLayers ] = ExtendedCatalogModelHelper.getExtendedGeoService(payload.service, parentId);
  const updatedLayers = serviceLayers.map(layer => {
    const currentLayer = currentLayers.find(l => l.id === layer.id);
    return { ...layer, expanded: currentLayer?.expanded || false };
  });
  const updatedService = { ...currentService, ...extendedService, expanded: currentService?.expanded || false };
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
  const parentId = payload.parentNode || getParentNode(state, CatalogItemKindEnum.FEATURE_SOURCE, payload.featureSource.id);
  const [ updatedFeatureSource, updatedFeatureTypes ] = ExtendedCatalogModelHelper.getExtendedFeatureSource(payload.featureSource, parentId);
  const idx = state.featureSources.findIndex(f => f.id === updatedFeatureSource.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    featureSources: [
      ...state.featureSources.slice(0, idx),
      {
        ...(state.featureSources[idx] || {}),
        ...updatedFeatureSource,
        expanded: state.featureSources[idx]?.expanded ?? false,
        catalogNodeId: parentId,
      },
      ...state.featureSources.slice(idx + 1),
    ],
    featureTypes: [
      ...state.featureTypes.filter(f => f.featureSourceId !== updatedFeatureSource.id),
      ...updatedFeatureTypes,
    ],
  };
};

const onUpdateFeatureType = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateFeatureType>,
): CatalogState => {
  const idx = state.featureTypes.findIndex(f => f.originalId === payload.featureType.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    featureTypes: [
      ...state.featureTypes.slice(0, idx),
      {
        ...state.featureTypes[idx],
        ...payload.featureType,
        id: state.featureTypes[idx].id,
      },
      ...state.featureTypes.slice(idx + 1),
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
    featureTypes: state.featureTypes.filter(f => f.featureSourceId !== payload.id),
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
  const updatedCatalog = payload.nodes.map<ExtendedCatalogNodeModel>(node => ({
    ...(currentCatalog.get(node.id) || {}),
    ...node,
    expanded: currentCatalog.get(node.id)?.expanded || false,
    parentId: payload.nodes.find(n => (n.children || []).includes(node.id))?.id || null,
  }));
  const geoServiceMap: Map<string, string> = new Map();
  const featureSourceMap: Map<string, string> = new Map();
  updatedCatalog.forEach(c => {
    if (!c.items || c.items.length === 0) {
      return;
    }
    c.items.forEach(item => {
      if (item.kind === CatalogItemKindEnum.GEO_SERVICE) {
        geoServiceMap.set(item.id, c.id);
      }
      if (item.kind === CatalogItemKindEnum.FEATURE_SOURCE) {
        featureSourceMap.set(item.id, c.id);
      }
    });
  });
  return {
    ...state,
    catalog: updatedCatalog,
    geoServices: state.geoServices.map(s => ({ ...s, catalogNodeId: geoServiceMap.get(s.id) || s.catalogNodeId })),
    geoServiceLayers: state.geoServiceLayers.map(l => ({ ...l, catalogNodeId: geoServiceMap.get(l.serviceId) || l.catalogNodeId })),
    featureSources: state.featureSources.map(f => ({ ...f, catalogNodeId: geoServiceMap.get(f.id) || f.catalogNodeId })),
    featureTypes: state.featureTypes.map(f => ({ ...f, catalogNodeId: geoServiceMap.get(f.featureSourceId) || f.catalogNodeId })),
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
  ...addFeatureSources(state, payload.featureSources),
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
  on(CatalogActions.loadAllGeoServicesStart, onLoadAllGeoServicesStart),
  on(CatalogActions.loadAllGeoServicesSuccess, onLoadAllGeoServicesSuccess),
  on(CatalogActions.loadAllGeoServicesFailed, onLoadAllGeoServicesFailed),
  on(CatalogActions.addGeoServices, onAddGeoServices),
  on(CatalogActions.updateGeoService, onUpdateGeoService),
  on(CatalogActions.deleteGeoService, onDeleteGeoService),
  on(CatalogActions.addFeatureSources, onAddFeatureSource),
  on(CatalogActions.updateFeatureSource, onUpdateFeatureSource),
  on(CatalogActions.deleteFeatureSource, onDeleteFeatureSource),
  on(CatalogActions.updateFeatureType, onUpdateFeatureType),
  on(CatalogActions.expandTree, onExpandTree),
  on(CatalogActions.updateCatalog, onUpdateCatalog),
  on(CatalogActions.loadFeatureSourcesStart, onLoadFeatureSourceStart),
  on(CatalogActions.loadFeatureSourcesSuccess, onLoadFeatureSourcesSuccess),
  on(CatalogActions.loadFeatureSourcesFailed, onLoadFeatureSourcesFailed),
  on(CatalogActions.updateFeatureSourceNodeIds, onUpdateFeatureSourceNodeIds),
  on(CatalogActions.updateGeoServiceNodeIds, onUpdateGeoServiceNodeIds),
);
export const catalogReducer = (state: CatalogState | undefined, action: Action) => catalogReducerImpl(state, action);

