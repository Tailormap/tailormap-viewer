import { createAction, props } from '@ngrx/store';
import { CatalogNodeModel, FeatureSourceModel, GeoServiceModel } from '@tailormap-admin/admin-api';

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
export const addGeoService = createAction(
  `${catalogActionsPrefix} Add Geo Service`,
  props<{ service: GeoServiceModel }>(),
);
export const addFeatureSource = createAction(
  `${catalogActionsPrefix} Add Feature Source`,
  props<{ featureSource: FeatureSourceModel }>(),
);
