import * as CatalogActions from './catalog.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CatalogState, initialCatalogState } from './catalog.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogHelper } from '../helpers/catalog.helper';
import { GeoServiceHelper } from '../helpers/geo-service.helper';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';

type ExpandableNode = { id: string; children?: string[] | null; expanded?: boolean };

const findParentsForExpansion = (list: ExpandableNode[], nodeId: string) => {
  const shouldExpand = !list.find(n => n.id === nodeId)?.expanded;
  if (!shouldExpand) {
    return [];
  }
  return CatalogHelper.findParentsForNode(list, nodeId);
};

const expandNode = <T extends ExpandableNode>(list: T[], nodeId: string): T[] => {
  const parentIds = findParentsForExpansion(list, nodeId);
  return list.map<T>(node => {
    let expanded = node.id === nodeId ? !node.expanded : node.expanded;
    if (parentIds.includes(node.id)) {
      expanded = true;
    }
    return { ...node, expanded };
  });
};

const onLoadCatalog = (state: CatalogState): CatalogState => ({
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
    const [ extService, serviceLayers ] = GeoServiceHelper.getExtendedGeoService(service, payload.parentNode);
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
  const [ extendedService, serviceLayers ] = GeoServiceHelper.getExtendedGeoService(payload.service, payload.parentNode);
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
): CatalogState => {
  const featureTypes: ExtendedFeatureTypeModel[] = [];
  const featureSources: ExtendedFeatureSourceModel[] = [];
  payload.featureSources.forEach(source => {
    const [ extFeatureSource, sourceFeatureTypes ] = GeoServiceHelper.getExtendedFeatureSource(source, payload.parentNode);
    featureSources.push(extFeatureSource);
    featureTypes.push(...sourceFeatureTypes);
  });
  return {
    ...state,
    featureSources: [ ...state.featureSources, ...featureSources ],
    featureTypes: [ ...state.featureTypes, ...featureTypes ],
  };
};

const onUpdateFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.updateFeatureSource>,
): CatalogState => {
  const idx = state.featureSources.findIndex(f => f.id === payload.featureSource.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    featureSources: [
      ...state.featureSources.slice(0, idx),
      { ...payload.featureSource, catalogNodeId: payload.parentNode },
      ...state.featureSources.slice(idx + 1),
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
    return { ...state, geoServices: expandNode(state.geoServices, payload.id) };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE) {
    return { ...state, geoServiceLayers: expandNode(state.geoServiceLayers, payload.id) };
  }
  if (payload.nodeType === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE) {
    return { ...state, featureSources: expandNode(state.featureSources, payload.id) };
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

const catalogReducerImpl = createReducer<CatalogState>(
  initialCatalogState,
  on(CatalogActions.loadCatalog, onLoadCatalog),
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
);
export const catalogReducer = (state: CatalogState | undefined, action: Action) => catalogReducerImpl(state, action);

