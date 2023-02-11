import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TreeModel } from '@tailormap-viewer/shared';
import { CatalogHelper } from '../helpers/catalog.helper';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectFeatureSources,
  (catalog, services, featureSources): TreeModel[] => CatalogHelper.catalogToTree(catalog, services, featureSources),
);
