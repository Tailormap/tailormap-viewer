import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

export const filterComponentStateKey = 'filterComponent';

export interface FilterComponentState {
  createFilterType?: FilterTypeEnum;
  selectedFilterGroup?: string;
  selectedLayers?: string[];
  selectedReferenceLayer?: string;
}

export const initialFilterComponentState: FilterComponentState = {
};
