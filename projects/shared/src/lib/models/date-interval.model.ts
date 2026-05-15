import { AttributeType, FilterDateIntervalEnum } from '@tailormap-viewer/api';

export interface DateIntervalModel {
  interval: FilterDateIntervalEnum;
  label: string;
  attributeType: AttributeType[];
}
