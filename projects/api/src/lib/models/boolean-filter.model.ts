import { FilterConditionEnum } from './filter-condition.enum';
import { FilterToolEnum } from './filter-tool.enum';

export interface BooleanFilterModel {
  filterTool: FilterToolEnum.BOOLEAN;
  value1?: string;
  value2?: string;
  alias1?: string;
  alias2?: string;
  startWithValue2?: boolean;
}

export interface UpdateBooleanFilterModel {
  filterTool: FilterToolEnum.BOOLEAN;
  condition?: FilterConditionEnum;
  value1?: string;
  value2?: string;
  alias1?: string;
  alias2?: string;
  startWithValue2?: boolean;
}
