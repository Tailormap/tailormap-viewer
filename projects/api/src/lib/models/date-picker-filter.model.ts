import { FilterToolEnum } from './filter-tool.enum';
import { FilterConditionEnum } from './filter-condition.enum';
import { DateTime } from 'luxon';

export interface DatePickerFilterModel {
  filterTool: FilterToolEnum.DATE_PICKER;
  initialDate?: DateTime;
  initialLowerDate?: DateTime;
  initialUpperDate?: DateTime;
}

export interface UpdateDatePickerFilterModel {
  filterTool: FilterToolEnum.DATE_PICKER;
  condition?: FilterConditionEnum;
  initialDate?: DateTime;
  initialLowerDate?: DateTime;
  initialUpperDate?: DateTime;
}
