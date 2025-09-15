import { FilterGroupModel } from '@tailormap-viewer/api';

export const filterStateKey = 'filter';

export interface FilterState {
  allFilterGroupsInConfig: FilterGroupModel[];
  filterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  allFilterGroupsInConfig: [],
  filterGroups: [],
};
