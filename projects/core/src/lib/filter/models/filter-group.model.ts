import { AttributeFilterModel } from './attribute-filter.model';

/**
 * Model to represent a group of attribute filters which can be joined by OR / AND.
 * Create a tree of filter groups using parentGroup to reference a parent ID
 */
export interface FilterGroupModel {
  id: string;
  source: string;
  layerId: number;
  filters: AttributeFilterModel[];
  operator: 'AND' | 'OR';
  parentGroup?: string;
}
