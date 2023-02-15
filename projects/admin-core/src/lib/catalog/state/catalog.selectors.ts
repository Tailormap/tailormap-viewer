import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TreeModel } from '@tailormap-viewer/shared';
import { CatalogHelper } from '../helpers/catalog.helper';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectGeoServiceLayers = createSelector(selectCatalogState, state => state.geoServiceLayers);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureSources,
  (catalog, services, layers, featureSources): TreeModel[] => {
    return CatalogHelper.catalogToTree(catalog, services, layers, featureSources);
  },
);
