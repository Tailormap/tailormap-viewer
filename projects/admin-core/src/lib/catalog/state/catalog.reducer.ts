import * as CatalogActions from './catalog.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CatalogState, initialCatalogState } from './catalog.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

type ExpandableNode = { id: string; children?: string[] | null; expanded?: boolean };

const findParentsForExpansion = (list: ExpandableNode[], nodeId: string) => {
  const shouldExpand = !list.find(n => n.id === nodeId)?.expanded;
  if (!shouldExpand) {
    return [];
  }
  const findParents = (id: string): string[] => {
    const parents = list.filter(n => n.children?.includes(id));
    return parents.reduce<string[]>((acc, parent) => [ ...acc, parent.id, ...findParents(parent.id) ], []);
  };
  return findParents(nodeId);
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
    const serviceLayers: ExtendedGeoServiceLayerModel[] = service.layers.map((layer, idx) => ({
      ...layer,
      id: layer.name || `virtual-layer-${idx}`,
      serviceId: `${service.id}`,
      catalogNodeId: payload.parentNode,
    }));
    services.push({
      ...service,
      id: `${service.id}`,
      catalogNodeId: payload.parentNode,
      layers: serviceLayers.map(layer => layer.id),
      capabilities: undefined, // do not store Blob in the state, should not be loaded anyway
    });
    layerModels.push(...serviceLayers);
  });
  return {
    ...state,
    geoServices: [ ...state.geoServices, ...services ],
    geoServiceLayers: [ ...state.geoServiceLayers, ...layerModels ],
  };
};

const onAddFeatureSource = (
  state: CatalogState,
  payload: ReturnType<typeof CatalogActions.addFeatureSource>,
): CatalogState => ({
  ...state,
  featureSources: [ ...state.featureSources, payload.featureSource ],
});

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
  return state;
};

const catalogReducerImpl = createReducer<CatalogState>(
  initialCatalogState,
  on(CatalogActions.loadCatalog, onLoadCatalog),
  on(CatalogActions.loadCatalogSuccess, onLoadCatalogsSuccess),
  on(CatalogActions.loadCatalogFailed, onLoadCatalogsFailed),
  on(CatalogActions.addGeoServices, onAddGeoServices),
  on(CatalogActions.addFeatureSource, onAddFeatureSource),
  on(CatalogActions.expandTree, onExpandTree),
);
export const catalogReducer = (state: CatalogState | undefined, action: Action) => catalogReducerImpl(state, action);

