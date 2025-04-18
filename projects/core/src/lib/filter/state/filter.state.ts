import { FilterGroupModel } from '@tailormap-viewer/api';

export const filterStateKey = 'filter';

export interface FilterState {
  filterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  filterGroups: [],
};
