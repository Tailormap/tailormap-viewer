import { FilterTypeEnum } from './filter-type.enum';

export interface BaseFilterModel {
  id: string;
  type: FilterTypeEnum;
  disabled?: boolean;
}
