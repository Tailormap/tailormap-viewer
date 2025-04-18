import { AttributeType } from './attribute-type.enum';
import { FilterConditionEnum } from './filter-condition.enum';
import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';

export interface AttributeFilterModel extends BaseFilterModel {
  attribute: string;
  attributeType: AttributeType;
  condition: FilterConditionEnum;
  invertCondition: boolean;
  caseSensitive: boolean;
  value: string[];
  type: FilterTypeEnum.ATTRIBUTE;
}
