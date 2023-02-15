import * as CatalogActions from './catalog.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { CatalogState, initialCatalogState } from './catalog.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { CatalogHelper } from '../helpers/catalog.helper';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

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
  catalog: payload.nodes,
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
    const serviceLayers = service.layers.map((layer, idx) => ({
      ...layer,
      id: layer.name || `virtual-layer-${idx}`,
      serviceId: `${service.id}`,
    }));
    services.push({
      ...service,
      id: `${service.id}`,
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
  const nodeId = payload.node.metadata?.id;
  if (!nodeId) {
    return state;
  }
  if (CatalogHelper.isCatalogNode(payload.node)) {
    return { ...state, catalog: state.catalog.map(node => ({ ...node, expanded: node.id === nodeId ? !node.expanded : node.expanded })) };
  }
  if (CatalogHelper.isServiceNode(payload.node)) {
    return { ...state, geoServices: state.geoServices.map(node => ({ ...node, expanded: node.id === nodeId ? !node.expanded : node.expanded })) };
  }
  if (CatalogHelper.isLayerNode(payload.node)) {
    return { ...state, geoServiceLayers: state.geoServiceLayers.map(node => ({ ...node, expanded: node.id === nodeId ? !node.expanded : node.expanded })) };
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

