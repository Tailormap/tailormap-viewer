import { FilterConditionEnum, FilterToolEnum } from '@tailormap-viewer/api';

export interface CheckboxFilterModel {
  filterTool: FilterToolEnum.CHECKBOX;
  condition?: FilterConditionEnum;
}
