import { FilterTypeEnum } from '@tailormap-viewer/api';

export const filterComponentStateKey = 'filterComponent';

export interface FilterComponentState {
  createFilterType?: FilterTypeEnum;
  selectedFilterGroup?: string;
  selectedLayers?: string[];
  selectedReferenceLayer?: string;
}

export const initialFilterComponentState: FilterComponentState = {
};
