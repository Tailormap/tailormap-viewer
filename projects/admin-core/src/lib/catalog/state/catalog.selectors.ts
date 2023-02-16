import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TreeModel } from '@tailormap-viewer/shared';
import { CatalogHelper } from '../helpers/catalog.helper';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectGeoServiceLayers = createSelector(selectCatalogState, state => state.geoServiceLayers);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);

export const selectCatalogNodeById = (id: string) => createSelector(
  selectCatalog,
  (catalog): ExtendedCatalogNodeModel | undefined => catalog.find(node => node.id === id),
);

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureSources,
  (catalog, services, layers, featureSources): CatalogTreeModel[] => {
    return CatalogHelper.catalogToTree(catalog, services, layers, featureSources);
  },
);
