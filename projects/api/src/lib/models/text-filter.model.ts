import { FilterConditionEnum } from './filter-condition.enum';
import { FilterToolEnum } from './filter-tool.enum';

export interface TextFilterModel {
  filterTool: FilterToolEnum.TEXT;
  initialText?: string;
}

export interface UpdateTextFilterModel extends TextFilterModel {
  caseSensitive?: boolean;
  condition?: FilterConditionEnum;
}


