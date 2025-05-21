import { FilterToolEnum } from './filter-tool.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export interface SliderFilterModel {
  filterTool: FilterToolEnum.SLIDER;
  initialValue?: number;
  minimumValue: number;
  maximumValue: number;
  initialLowerValue?: number;
  initialUpperValue?: number;
}

export interface UpdateSliderFilterModel {
  filterTool: FilterToolEnum.SLIDER;
  condition?: FilterConditionEnum;
  initialValue?: number;
  minimumValue: number;
  maximumValue: number;
  initialLowerValue?: number;
  initialUpperValue?: number;
}
