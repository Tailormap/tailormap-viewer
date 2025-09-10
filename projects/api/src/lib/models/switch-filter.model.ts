import { FilterConditionEnum } from './filter-condition.enum';
import { FilterToolEnum } from './filter-tool.enum';

export interface SwitchFilterModel {
  filterTool: FilterToolEnum.SWITCH;
  value1?: string;
  value2?: string;
  alias1?: string;
  alias2?: string;
  startWithValue2?: boolean;
}

export interface UpdateSwitchFilterModel extends SwitchFilterModel {
  condition?: FilterConditionEnum;
}
