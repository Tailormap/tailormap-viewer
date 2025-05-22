import { FilterToolEnum } from './filter-tool.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export interface CheckboxFilterModel {
  filterTool: FilterToolEnum.CHECKBOX;
  condition?: FilterConditionEnum;
}
