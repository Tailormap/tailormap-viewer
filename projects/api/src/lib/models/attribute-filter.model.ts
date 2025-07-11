import { AttributeType } from './attribute-type.enum';
import { FilterConditionEnum } from './filter-condition.enum';
import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';
import { SliderFilterModel } from './slider-filter.model';
import { CheckboxFilterModel } from './checkbox-filter.model';
import { SwitchFilterModel } from './switch-filter.model';
import { DatePickerFilterModel } from './date-picker-filter.model';

export interface AttributeFilterModel extends BaseFilterModel {
  attribute: string;
  attributeType: AttributeType;
  condition: FilterConditionEnum;
  invertCondition: boolean;
  caseSensitive: boolean;
  value: string[];
  type: FilterTypeEnum.ATTRIBUTE;
  editConfiguration?: SliderFilterModel | CheckboxFilterModel | SwitchFilterModel | DatePickerFilterModel;
  attributeNotFound?: boolean;
}
