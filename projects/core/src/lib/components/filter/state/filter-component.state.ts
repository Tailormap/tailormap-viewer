import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

export const filterComponentStateKey = 'filterComponent';

export interface FilterComponentState {
  createFilterType?: FilterTypeEnum;
  selectedFilterGroup?: string;
}

export const initialFilterComponentState: FilterComponentState = {
};
