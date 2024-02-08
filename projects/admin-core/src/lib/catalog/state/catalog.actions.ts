import { createAction, props } from '@ngrx/store';
import {
  CatalogNodeModel, FeatureSourceModel, FeatureSourceSummaryWithFeatureTypesModel, FeatureTypeModel,
  GeoServiceSummaryWithLayersModel, GeoServiceWithLayersModel,
} from '@tailormap-admin/admin-api';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';

const catalogActionsPrefix = '[Catalog]';

export const loadCatalog = createAction(
  `${catalogActionsPrefix} Load Catalog`,
);
export const loadCatalogStart = createAction(
  `${catalogActionsPrefix} Load Catalog Start`,
);
export const loadCatalogSuccess = createAction(
  `${catalogActionsPrefix}  Load Catalog Success`,
  props<{
    nodes: CatalogNodeModel[];
    geoServices: GeoServiceSummaryWithLayersModel[];
    featureSources: FeatureSourceSummaryWithFeatureTypesModel[];
  }>(),
);
export const loadCatalogFailed = createAction(
  `${catalogActionsPrefix}  Load Catalog Failed`,
  props<{
    catalogError?: string;
    geoServiceError?: string;
    featureSourceError?: string;
  }>(),
);
export const addGeoService = createAction(
  `${catalogActionsPrefix} Add Geo Services`,
  props<{ service: GeoServiceWithLayersModel }>(),
);
export const updateGeoService = createAction(
  `${catalogActionsPrefix} Update Geo Service`,
  props<{ service: GeoServiceWithLayersModel }>(),
);
export const deleteGeoService = createAction(
  `${catalogActionsPrefix} Delete Geo Service`,
  props<{ id: string }>(),
);
export const addFeatureSources = createAction(
  `${catalogActionsPrefix} Add Feature Source`,
  props<{ featureSource: FeatureSourceModel }>(),
);
export const updateFeatureSource = createAction(
  `${catalogActionsPrefix} Update Feature Source`,
  props<{ featureSource: FeatureSourceModel }>(),
);
export const deleteFeatureSource = createAction(
  `${catalogActionsPrefix} Delete Feature Source`,
  props<{ id: string }>(),
);
export const updateFeatureType = createAction(
  `${catalogActionsPrefix} Update Feature Type`,
  props<{ featureType: FeatureTypeModel }>(),
);
export const expandTree = createAction(
  `${catalogActionsPrefix} Expand Tree`,
  props<{ id: string; nodeType: CatalogTreeModelTypeEnum; toggle?: boolean }>(),
);
export const updateCatalog = createAction(
  `${catalogActionsPrefix}  Update Catalog`,
  props<{ nodes: CatalogNodeModel[] }>(),
);
export const loadDraftGeoService = createAction(
  `${catalogActionsPrefix} Load Draft Geo Service`,
  props<{ id: string }>(),
);
export const loadDraftGeoServiceStart = createAction(
  `${catalogActionsPrefix} Load Draft Geo Service Start`,
);
export const loadDraftGeoServiceSuccess = createAction(
  `${catalogActionsPrefix} Load Draft Geo Service Success`,
  props<{ geoService: GeoServiceWithLayersModel }>(),
);
export const loadDraftGeoServiceFailed = createAction(
  `${catalogActionsPrefix} Load Draft Geo Service Failed`,
  props<{ error?: string }>(),
);
export const loadDraftFeatureSource = createAction(
  `${catalogActionsPrefix} Load Draft Feature Source`,
  props<{ id: string }>(),
);
export const loadDraftFeatureSourceStart = createAction(
  `${catalogActionsPrefix} Load Draft Feature Source Start`,
);
export const loadDraftFeatureSourceSuccess = createAction(
  `${catalogActionsPrefix} Load Draft Feature Source Success`,
  props<{ featureSource: FeatureSourceModel }>(),
);
export const loadDraftFeatureSourceFailed = createAction(
  `${catalogActionsPrefix} Load Draft Feature Source Failed`,
  props<{ error?: string }>(),
);
