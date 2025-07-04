import { FilterToolEnum } from './filter-tool.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export interface DatePickerFilterModel {
  filterTool: FilterToolEnum.DATE_PICKER;
  initialDate?: string;
  initialLowerDate?: string;
  initialUpperDate?: string;
}

export interface UpdateDatePickerFilterModel {
  filterTool: FilterToolEnum.DATE_PICKER;
  condition?: FilterConditionEnum;
  initialDate?: string;
  initialLowerDate?: string;
  initialUpperDate?: string;
}
