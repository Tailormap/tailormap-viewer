import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';


export interface FilterState {
  // All filter groups that are defined in the application config
  configuredFilterGroups: FilterGroupModel<AttributeFilterModel>[];

  // Filter groups in their current state, i.e. with changes from users
  currentFilterGroups: FilterGroupModel[];
}

export const initialFilterState: FilterState = {
  configuredFilterGroups: [],
  currentFilterGroups: [],
};
