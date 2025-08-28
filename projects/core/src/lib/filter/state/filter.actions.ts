import { createAction, props } from '@ngrx/store';
import { FilterGroupModel } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '@tailormap-viewer/api';

const filterActionsPrefix = '[Filter]';

export const addFilterGroup = createAction(
  `${filterActionsPrefix} Add Filter Group`,
  props<{ filterGroup: FilterGroupModel }>(),
);

export const removeFilterGroup = createAction(
  `${filterActionsPrefix} Remove Filter Group`,
  props<{ filterGroupId: string }>(),
);

export const updateFilterGroup = createAction(
  `${filterActionsPrefix} Update Filter Group`,
  props<{ filterGroup: FilterGroupModel }>(),
);

export const addFilter = createAction(
  `${filterActionsPrefix} Add Attribute Filter`,
  props<{ filterGroupId: string; filter: AttributeFilterModel }>(),
);

export const removeFilter = createAction(
  `${filterActionsPrefix} Remove Attribute Filter`,
  props<{ filterGroupId: string; filterId: string }>(),
);

export const updateFilter = createAction(
  `${filterActionsPrefix} Update Attribute Filter`,
  props<{ filterGroupId: string; filter: AttributeFilterModel }>(),
);

export const toggleFilterDisabled = createAction(
  `${filterActionsPrefix} Toggle Filter Disabled`,
  props<{ filterGroupId: string }>(),
);

export const setSingleFilterDisabled = createAction(
  `${filterActionsPrefix} Toggle Single Filter Disabled`,
  props<{ filterGroupId: string; filterId: string; disabled: boolean }>(),
);
