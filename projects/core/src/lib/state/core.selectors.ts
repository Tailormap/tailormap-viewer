import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CoreState, coreStateKey } from './core.state';
import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';

const selectCoreState = createFeatureSelector<CoreState>(coreStateKey);

export const selectMapOptions = createSelector(
  selectCoreState,
  (state: CoreState) => {
    if (!state.crs) {
      return null;
    }
    return {
      projection: state.crs.code,
      projectionDefinition: state.crs.definition,
      maxExtent: state.maxExtent ? [
        state.maxExtent.minx,
        state.maxExtent.miny,
        state.maxExtent.maxx,
        state.maxExtent.maxy,
      ] : [],
      initialExtent: state.initialExtent ? [
        state.initialExtent.minx,
        state.initialExtent.miny,
        state.initialExtent.maxx,
        state.initialExtent.maxy,
      ] : [],
    };
  },
);

export const selectServices = createSelector(
  selectCoreState,
  state => state.services,
);

const getLayersAndServices = (layers: AppLayerModel[], services: ServiceModel[]) => {
  return layers.map(layer => ({
    layer,
    service: services.find(s => s.id === layer.serviceId),
  }));
};

export const selectBaseLayers = createSelector(
  selectCoreState,
  selectServices,
  (state, services: ServiceModel[]) => getLayersAndServices(state.baseLayers, services),
);
export const selectLayers = createSelector(
  selectCoreState,
  selectServices,
  (state, services: ServiceModel[]) => getLayersAndServices(state.layers, services),
);
