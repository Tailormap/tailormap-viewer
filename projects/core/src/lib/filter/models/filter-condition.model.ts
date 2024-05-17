import { AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum } from './filter-condition.enum';

export interface FilterConditionModel {
  condition: FilterConditionEnum;
  label: string;
  attributeType: AttributeType[];
  readableLabel: string;
  inverseReadableLabel: string;
}
