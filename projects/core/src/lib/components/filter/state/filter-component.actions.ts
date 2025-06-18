import { createAction, props } from '@ngrx/store';
import { FilterTypeEnum, SpatialFilterModel, FilterGroupModel } from '@tailormap-viewer/api';

const filterComponentActionsPrefix = '[FilterComponent]';

export const createFilter = createAction(
  `${filterComponentActionsPrefix} Create Filter`,
  props<{ filterType: FilterTypeEnum }>(),
);

export const closeForm = createAction(`${filterComponentActionsPrefix} Close Filter Form`);

export const setSelectedFilterGroup = createAction(
  `${filterComponentActionsPrefix} Set Selected Filter Group`,
  props<{ filterGroup: FilterGroupModel<SpatialFilterModel> }>(),
);

export const setSelectedLayers = createAction(
  `${filterComponentActionsPrefix} Set Selected Layers`,
  props<{ layers: string[] }>(),
);

export const setSelectedSpatialFilterFeatureId = createAction(
  `${filterComponentActionsPrefix} Set Selected Spatial Filter Feature ID`,
  props<{ featureId: string | null }>(),
);
