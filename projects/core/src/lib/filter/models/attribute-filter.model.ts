import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from './filter-condition.enum';

export interface AttributeFilterModel {
  id: string;
  attribute: string;
  attributeType: FeatureAttributeTypeEnum;
  condition: FilterConditionEnum;
  invertCondition: boolean;
  caseSensitive: boolean;
  value: string[];
}
