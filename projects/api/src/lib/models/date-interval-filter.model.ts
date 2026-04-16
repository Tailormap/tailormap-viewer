import { FilterToolEnum } from './filter-tool.enum';
import { FilterDateIntervalEnum } from './filter-date-interval.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export interface DateIntervalFilterModel {
  filterTool: FilterToolEnum.DATE_INTERVAL;
  condition: FilterConditionEnum;
  interval: FilterDateIntervalEnum;
  stepSize: number;
  isTimestamp: boolean;
  initialValue: string;
  minimumDate: string;
  maximumDate: string;
}
