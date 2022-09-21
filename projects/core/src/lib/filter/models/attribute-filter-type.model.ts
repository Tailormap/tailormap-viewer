import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from './filter-condition.enum';

export interface AttributeFilterTypeModel {
  condition: FilterConditionEnum;
  label: string;
  attributeType: FeatureAttributeTypeEnum[];
  readableLabel: string;
}
