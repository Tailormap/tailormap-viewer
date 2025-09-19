import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';

export const filterStateKey = 'filter';

export interface FilterState {
  // All filter groups that are defined in the application config
  configuredFilterGroups: FilterGroupModel<AttributeFilterModel>[];

  // Validated filter groups in their current state, i.e. with changes from users
  verifiedCurrentFilterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  configuredFilterGroups: [],
  verifiedCurrentFilterGroups: [],
};
