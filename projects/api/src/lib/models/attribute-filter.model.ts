import { AttributeType } from './attribute-type.enum';
import { FilterConditionEnum } from './filter-condition.enum';
import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';
import { EditFilterConfigurationModel } from './edit-filter-configuration.model';

export interface AttributeFilterModel extends BaseFilterModel {
  attribute: string;
  attributeType: AttributeType;
  condition: FilterConditionEnum;
  invertCondition: boolean;
  caseSensitive: boolean;
  value: string[];
  type: FilterTypeEnum.ATTRIBUTE;
  editConfiguration?: EditFilterConfigurationModel;
  attributeNotFound?: boolean;
  generatedByFilterId?: string;
  attributeAlias?: string;
}
