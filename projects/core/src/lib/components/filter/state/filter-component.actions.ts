import { createAction, props } from '@ngrx/store';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

const filterComponentActionsPrefix = '[FilterComponent]';

export const createFilter = createAction(
  `${filterComponentActionsPrefix} Create Filter`,
  props<{ filterType: FilterTypeEnum }>(),
);

export const clearCreateFilter = createAction(`${filterComponentActionsPrefix} Clear Create Filter`);
