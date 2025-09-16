import { FilterGroupModel } from '@tailormap-viewer/api';

export const filterStateKey = 'filter';

export interface FilterState {
  // All filter groups that are defined in the application config
  allFilterGroupsInConfig: FilterGroupModel[];

  // Validated filter groups for visible layers
  activeFilterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  allFilterGroupsInConfig: [],
  activeFilterGroups: [],
};
