import { BaseFilterModel } from './base-filter.model';
import { FilterTypeEnum } from './filter-type.enum';

/**
 * Model to represent a group of attribute filters which can be joined by OR / AND.
 * Create a tree of filter groups using parentGroup to reference a parent ID
 */
export interface FilterGroupModel<FilterType = BaseFilterModel> {
  id: string;
  source: string;
  layerIds: number[];
  type: FilterTypeEnum;
  filters: FilterType[];
  disabled?: boolean;
  operator: 'AND' | 'OR';
  parentGroup?: string;
}
