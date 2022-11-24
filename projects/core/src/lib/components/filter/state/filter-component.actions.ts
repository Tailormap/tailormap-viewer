import { createAction, props } from '@ngrx/store';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

const filterComponentActionsPrefix = '[FilterComponent]';

export const createFilter = createAction(
  `${filterComponentActionsPrefix} Create Filter`,
  props<{ filterType: FilterTypeEnum }>(),
);

export const closeForm = createAction(`${filterComponentActionsPrefix} Close Filter Form`);

export const setSelectedFilterGroup = createAction(
  `${filterComponentActionsPrefix} Set Selected Filter Group`,
  props<{ id: string }>(),
);
