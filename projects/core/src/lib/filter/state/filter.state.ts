import { FilterGroupModel } from '../models/filter-group.model';

export const filterStateKey = 'filter';

export interface FilterState {
  filterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  filterGroups: [],
};
