import { AttributeType, FilterConditionEnum } from '@tailormap-viewer/api';

export interface FilterConditionModel {
  condition: FilterConditionEnum;
  label: string;
  attributeType: AttributeType[];
  readableLabel: string;
  inverseReadableLabel: string;
}
