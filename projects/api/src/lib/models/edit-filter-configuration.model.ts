import { UpdateSliderFilterModel } from './slider-filter.model';
import { CheckboxFilterModel } from './checkbox-filter.model';
import { UpdateSwitchFilterModel } from './switch-filter.model';
import { UpdateDatePickerFilterModel } from './date-picker-filter.model';
import { DropdownListFilterModel } from './dropdown-list-filter.model';
import { DateIntervalFilterModel } from './date-interval-filter.model';


export type EditFilterConfigurationModel = UpdateSliderFilterModel
  | CheckboxFilterModel
  | UpdateSwitchFilterModel
  | UpdateDatePickerFilterModel
  | DropdownListFilterModel
  | DateIntervalFilterModel;
