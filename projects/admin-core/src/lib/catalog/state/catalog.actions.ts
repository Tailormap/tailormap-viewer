import { createAction, props } from '@ngrx/store';
import { CatalogNodeModel, FeatureSourceModel, GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';
import { CatalogTreeModel } from '../models/catalog-tree.model';

const catalogActionsPrefix = '[Catalog]';

export const loadCatalog = createAction(
  `${catalogActionsPrefix} Load Catalog`,
);
export const loadCatalogSuccess = createAction(
  `${catalogActionsPrefix}  Load Catalog Success`,
  props<{ nodes: CatalogNodeModel[] }>(),
);
export const loadCatalogFailed = createAction(
  `${catalogActionsPrefix}  Load Catalog Failed`,
  props<{ error?: string }>(),
);
export const addGeoServices = createAction(
  `${catalogActionsPrefix} Add Geo Services`,
  props<{ services: GeoServiceWithLayersModel[] }>(),
);
export const addFeatureSource = createAction(
  `${catalogActionsPrefix} Add Feature Source`,
  props<{ featureSource: FeatureSourceModel }>(),
);
export const expandTree = createAction(
  `${catalogActionsPrefix} Expand Tree`,
  props<{ node: CatalogTreeModel }>(),
);
