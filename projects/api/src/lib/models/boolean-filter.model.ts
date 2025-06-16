import { FilterConditionEnum } from './filter-condition.enum';
import { FilterToolEnum } from './filter-tool.enum';

export interface BooleanFilterModel {
  filterTool: FilterToolEnum.BOOLEAN;
  value1?: string | boolean;
  value2?: string | boolean;
  alias1?: string;
  alias2?: string;
}

export interface UpdateBooleanFilterModel {
  filterTool: FilterToolEnum.BOOLEAN;
  condition?: FilterConditionEnum;
  value1?: string | boolean;
  value2?: string | boolean;
  alias1?: string;
  alias2?: string;
}
