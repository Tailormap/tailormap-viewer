import { FilterToolEnum } from './filter-tool.enum';
import { FilterDateIntervalEnum } from './filter-date-interval.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export interface DateIntervalFilterModel {
  filterTool: FilterToolEnum.DATE_INTERVAL;
  condition: FilterConditionEnum.DATE_INTERVAL;
  interval: FilterDateIntervalEnum;
  initialValue: string;
  minimumDate: string;
  maximumDate: string;
}
