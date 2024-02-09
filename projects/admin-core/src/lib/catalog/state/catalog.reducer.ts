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
import {
  CatalogItemKindEnum, FeatureSourceSummaryWithFeatureTypesModel, GeoServiceSummaryWithLayersModel,
} from '@tailormap-admin/admin-api';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';

type ExpandableNode = { id: string; children?: string[] | null; expanded?: boolean };

const findParentsForExpansion = (list: ExpandableNode[], nodeId: string) => {
  const shouldExpand = !list.find(n => n.id === nodeId)?.expanded;
  if (!shouldExpand) {
    return [];
  }
  return CatalogTreeHelper.findParentsForNode(list, nodeId);
};

const expandNode = <T extends ExpandableNode>(
  list: T[],
  nodeId: string,
  toggle?: boolean,
): T[] => {
  const parentIds = findParentsForExpansion(list, nodeId);
  return list.map<T>(node => {
    let expanded = node.id === nodeId
      ? (typeof toggle === 'boolean' && toggle ? !node.expanded : true)
      : node.expanded;
    if (parentIds.includes(node.id)) {
      expanded = true;
    }
    return { ...node, expanded };
  });
};

const getParentNodeList = (catalog: ExtendedCatalogNodeModel[]) => {
  const nodesList = new Map<string, string>();
  catalog.forEach(c => {
    c.items?.forEach(i => {
      nodesList.set(`${i.kind}_${i.id}`, c.id);
    });
  });
  return nodesList;
};

const getParentNode = (nodeList: Map<string, string>, type: CatalogItemKindEnum, id: string) => {
  return nodeList.get(`${type}_${id}`) || '';
};

const addFeatureSources = (
  state: CatalogState,
  catalog: ExtendedCatalogNodeModel[],
  featureSources: FeatureSourceSummaryWithFeatureTypesModel[],
) => {
  const featureTypes: ExtendedFeatureTypeModel[] = [];
  const extendedFeatureSources: ExtendedFeatureSourceModel[] = [];
  const existingFeatureSources = new Set(state.featureSources.map(s => s.id));
  const sources = featureSources.filter(source => !existingFeatureSources.has(`${source.id}`));
  const parentNodeList = getParentNodeList(catalog);
  sources.forEach(source => {
    const parentId = getParentNode(parentNodeList, CatalogItemKindEnum.FEATURE_SOURCE, source.id);
    const [ extFeatureSource, sourceFeatureTypes ] = ExtendedCatalogModelHelper.getExtendedFeatureSource(source, parentId);
    extendedFeatureSources.push(extFeatureSource);
    featureTypes.push(...sourceFeatureTypes);
  });
  return {
    featureSources: [ ...state.featureSources, ...extendedFeatureSources ],
    featureTypes: [ ...state.featureTypes, ...featureTypes ],
  };
};

const addGeoServices = (
  state: CatalogState,
  catalog: ExtendedCatalogNodeModel[],
  newServices: GeoServiceSummaryWithLayersModel[],
) => {
  const layerModels: ExtendedGeoServiceLayerModel[] = [];
  const services: ExtendedGeoServiceModel[] = [];
  const existingServices = new Set(state.geoServices.map(s => s.id));
  const filteredServices = newServices.filter(s => !existingServices.has(s.id));
  const parentNodeList = getParentNodeList(catalog);
  filteredServices
    .forEach(service => {
      const parentId = getParentNode(parentNodeList, CatalogItemKindEnum.GEO_SERVICE, service.id);
      const [ extService, serviceLayers ] = ExtendedCatalogModelHelper.getExtendedGeoService(service, parentId);
      services.push(extService);
      layerModels.push(...serviceLayers);
    });
  return {
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
): CatalogState => {
  const catalog: ExtendedCatalogNodeModel[] = payload.nodes.map(node => ({
    ...node,
    type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE,
    parentId: payload.nodes.find(n => (n.children || []).includes(node.id))?.id || null,
  }));
  return {
    ...state,
    catalogLoadStatus: LoadingStateEnum.LOADED,
    catalogLoadError: undefined,
    catalog,
    ...addGeoServices(state, catalog, payload.geoServices),
    ...addFeatureSources(state, catalog, payload.featureSources),
  };
};

const onLoadCatalogsFailed = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.loadCatalogFailed>,
): CatalogState => ({
  ...state,
  catalogLoadStatus: LoadingStateEnum.FAILED,
  catalogLoadError: [ payload.catalogError, payload.geoServiceError, payload.featureSourceError ].filter(Boolean).join(' - '),
  catalog: [],
});

const onAddGeoService = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addGeoService>,
): CatalogState => {
  return {
    ...state,
    ...addGeoServices(state, state.catalog, [ExtendedCatalogModelHelper.getGeoServiceSummaryModel(payload.service)]),
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
  const parentId = getParentNode(getParentNodeList(state.catalog), CatalogItemKindEnum.GEO_SERVICE, payload.service.id);
  const geoServiceLayerSummary = ExtendedCatalogModelHelper.getGeoServiceSummaryModel(payload.service);
  const [ extendedService, serviceLayers ] = ExtendedCatalogModelHelper.getExtendedGeoService(geoServiceLayerSummary, parentId);
  const updatedLayers = serviceLayers.map(layer => {
    const currentLayer = currentLayers.find(l => l.id === layer.id);
    return { ...layer, expanded: currentLayer?.expanded };
  });
  const updatedService = { ...currentService, ...extendedService, expanded: currentService?.expanded };
  return {
    ...state,
    geoServices: [ ...services, updatedService ],
    geoServiceLayers: [ ...layers, ...updatedLayers ],
    draftGeoService: state.draftGeoService?.id === payload.service.id
      ? payload.service
      : state.draftGeoService,
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
    draftGeoService: state.draftGeoService?.id === payload.id
      ? null
      : state.draftGeoService,
  };
};

const onAddFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addFeatureSources>,
): CatalogState => {
  return {
    ...state,
    ...addFeatureSources(state, state.catalog, [ExtendedCatalogModelHelper.getFeatureSourceSummaryModel(payload.featureSource)]),
  };
};

const onUpdateFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateFeatureSource>,
): CatalogState => {
  const parentId = getParentNode(getParentNodeList(state.catalog), CatalogItemKindEnum.FEATURE_SOURCE, payload.featureSource.id);
  const featureSourceSummary = ExtendedCatalogModelHelper.getFeatureSourceSummaryModel(payload.featureSource);
  const [ updatedFeatureSource, updatedFeatureTypes ] = ExtendedCatalogModelHelper.getExtendedFeatureSource(featureSourceSummary, parentId);
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
        expanded: state.featureSources[idx]?.expanded,
        catalogNodeId: parentId,
      },
      ...state.featureSources.slice(idx + 1),
    ],
    featureTypes: [
      ...state.featureTypes.filter(f => f.featureSourceId !== updatedFeatureSource.id),
      ...updatedFeatureTypes,
    ],
    draftFeatureSource: `${state.draftFeatureSource?.id}` === `${payload.featureSource.id}`
      ? payload.featureSource
      : state.draftFeatureSource,
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
  const summary = ExtendedCatalogModelHelper.getFeatureTypeSummaryModel(payload.featureType);
  const draftFeatureSource = state.draftFeatureSource ? { ...state.draftFeatureSource } : null;
  if (draftFeatureSource) {
    const ftIndex = draftFeatureSource.featureTypes.findIndex(ft => ft.id === payload.featureType.id);
    if (ftIndex !== -1) {
      draftFeatureSource.featureTypes = [
        ...draftFeatureSource.featureTypes.slice(0, ftIndex),
        payload.featureType,
        ...draftFeatureSource.featureTypes.slice(ftIndex + 1),
      ];
    }
  }
  return {
    ...state,
    featureTypes: [
      ...state.featureTypes.slice(0, idx),
      {
        ...state.featureTypes[idx],
        ...summary,
        type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
        id: state.featureTypes[idx].id,
      },
      ...state.featureTypes.slice(idx + 1),
    ],
    draftFeatureSource,
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
    draftFeatureSource: state.draftFeatureSource?.id === payload.id
      ? null
      : state.draftFeatureSource,
  };
};

const onExpandTree = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.expandTree>,
): CatalogState => {
  if (payload.nodeType === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE) {
    return { ...state, catalog: expandNode(state.catalog, payload.id, payload.toggle) };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.SERVICE_TYPE) {
    const service = state.geoServices.find(s => s.id === payload.id);
    return {
      ...state,
      geoServices: expandNode(state.geoServices, payload.id, payload.toggle),
      catalog: service && !service.expanded
        ? expandNode(state.catalog, service.catalogNodeId, false)
        : state.catalog,
    };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE) {
    const layer = state.geoServiceLayers.find(l => l.id === payload.id);
    return {
      ...state,
      geoServiceLayers: expandNode(state.geoServiceLayers, payload.id, payload.toggle),
      geoServices: layer && !layer.expanded
        ? expandNode(state.geoServices, layer.serviceId, false)
        : state.geoServices,
      catalog: layer && !layer.expanded
        ? expandNode(state.catalog, layer.catalogNodeId, false)
        : state.catalog,
    };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE || payload.nodeType === CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE) {
    let featureSourceId = payload.id;
    if (payload.nodeType === CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE) {
      const featureType = state.featureTypes.find(f => f.id === payload.id);
      featureSourceId = featureType ? featureType.featureSourceId : featureSourceId;
    }
    const featureSource = state.featureSources.find(f => f.id === featureSourceId);
    return {
      ...state,
      featureSources: expandNode(state.featureSources, featureSourceId, payload.toggle),
      catalog: featureSource && !featureSource.expanded
        ? expandNode(state.catalog, featureSource.catalogNodeId, false)
        : state.catalog,
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
    type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE,
    expanded: currentCatalog.get(node.id)?.expanded,
    parentId: payload.nodes.find(n => (n.children || []).includes(node.id))?.id || null,
  }));
  const parentNodeList = getParentNodeList(updatedCatalog);
  return {
    ...state,
    catalog: updatedCatalog,
    geoServices: state.geoServices.map(s => ({
      ...s,
      catalogNodeId: getParentNode(parentNodeList, CatalogItemKindEnum.GEO_SERVICE, s.id) || s.catalogNodeId,
    })),
    geoServiceLayers: state.geoServiceLayers.map(l => ({
      ...l,
      catalogNodeId: getParentNode(parentNodeList, CatalogItemKindEnum.GEO_SERVICE, l.serviceId) || l.catalogNodeId,
    })),
    featureSources: state.featureSources.map(f => ({
      ...f,
      catalogNodeId: getParentNode(parentNodeList, CatalogItemKindEnum.FEATURE_SOURCE, f.id) || f.catalogNodeId,
    })),
    featureTypes: state.featureTypes.map(f => ({
      ...f,
      catalogNodeId: getParentNode(parentNodeList, CatalogItemKindEnum.FEATURE_SOURCE, f.featureSourceId) || f.catalogNodeId,
    })),
  };
};

const onLoadDraftGeoService = (state: CatalogState, payload: ReturnType<typeof CatalogActions.loadDraftGeoService>): CatalogState => ({
  ...state,
  draftGeoServiceId: payload.id,
});

const onLoadDraftGeoServiceStart = (state: CatalogState): CatalogState => ({
  ...state,
  draftGeoServiceLoadStatus: LoadingStateEnum.LOADING,
  draftGeoService: null,
});

const onLoadDraftGeoServiceSuccess = (state: CatalogState, payload: ReturnType<typeof CatalogActions.loadDraftGeoServiceSuccess>): CatalogState => ({
  ...state,
  draftGeoServiceLoadStatus: LoadingStateEnum.LOADED,
  draftGeoService: payload.geoService,
});

const onLoadDraftGeoServiceFailed = (state: CatalogState): CatalogState => ({
  ...state,
  draftGeoServiceId: null,
  draftGeoServiceLoadStatus: LoadingStateEnum.FAILED,
  draftGeoService: null,
});

const onLoadDraftFeatureSource = (state: CatalogState, payload: ReturnType<typeof CatalogActions.loadDraftFeatureSource>): CatalogState => ({
  ...state,
  draftFeatureSourceId: payload.id,
});

const onLoadDraftFeatureSourceStart = (state: CatalogState): CatalogState => ({
  ...state,
  draftFeatureSourceLoadStatus: LoadingStateEnum.LOADING,
  draftFeatureSource: null,
});

const onLoadDraftFeatureSourceSuccess = (state: CatalogState, payload: ReturnType<typeof CatalogActions.loadDraftFeatureSourceSuccess>): CatalogState => ({
  ...state,
  draftFeatureSourceLoadStatus: LoadingStateEnum.LOADED,
  draftFeatureSource: payload.featureSource,
});

const onLoadDraftFeatureSourceFailed = (state: CatalogState): CatalogState => ({
  ...state,
  draftFeatureSourceId: null,
  draftFeatureSourceLoadStatus: LoadingStateEnum.FAILED,
  draftFeatureSource: null,
});

const onSetCatalogFilterTerm = (state: CatalogState, payload: ReturnType<typeof CatalogActions.setCatalogFilterTerm>): CatalogState => ({
  ...state,
  filterTerm: payload.filterTerm || undefined,
});

const catalogReducerImpl = createReducer<CatalogState>(
  initialCatalogState,
  on(CatalogActions.loadCatalogStart, onLoadCatalogStart),
  on(CatalogActions.loadCatalogSuccess, onLoadCatalogsSuccess),
  on(CatalogActions.loadCatalogFailed, onLoadCatalogsFailed),
  on(CatalogActions.addGeoService, onAddGeoService),
  on(CatalogActions.updateGeoService, onUpdateGeoService),
  on(CatalogActions.deleteGeoService, onDeleteGeoService),
  on(CatalogActions.addFeatureSources, onAddFeatureSource),
  on(CatalogActions.updateFeatureSource, onUpdateFeatureSource),
  on(CatalogActions.deleteFeatureSource, onDeleteFeatureSource),
  on(CatalogActions.updateFeatureType, onUpdateFeatureType),
  on(CatalogActions.expandTree, onExpandTree),
  on(CatalogActions.updateCatalog, onUpdateCatalog),
  on(CatalogActions.loadDraftGeoService, onLoadDraftGeoService),
  on(CatalogActions.loadDraftGeoServiceStart, onLoadDraftGeoServiceStart),
  on(CatalogActions.loadDraftGeoServiceSuccess, onLoadDraftGeoServiceSuccess),
  on(CatalogActions.loadDraftGeoServiceFailed, onLoadDraftGeoServiceFailed),
  on(CatalogActions.loadDraftFeatureSource, onLoadDraftFeatureSource),
  on(CatalogActions.loadDraftFeatureSourceStart, onLoadDraftFeatureSourceStart),
  on(CatalogActions.loadDraftFeatureSourceSuccess, onLoadDraftFeatureSourceSuccess),
  on(CatalogActions.loadDraftFeatureSourceFailed, onLoadDraftFeatureSourceFailed),
  on(CatalogActions.setCatalogFilterTerm, onSetCatalogFilterTerm),
);
export const catalogReducer = (state: CatalogState | undefined, action: Action) => catalogReducerImpl(state, action);

