import { FilterToolEnum } from './filter-tool.enum';
import { FilterConditionEnum } from './filter-condition.enum';

export enum SliderFilterInputModeEnum {
  SLIDER = 'SLIDER',
  INPUT_FIELD = 'INPUT_FIELD',
  SLIDER_AND_INPUT_FIELD = 'SLIDER_AND_INPUT_FIELD',
}

export interface SliderFilterModel {
  filterTool: FilterToolEnum.SLIDER;
  initialValue?: number | null;
  minimumValue: number;
  maximumValue: number;
  initialLowerValue?: number | null;
  initialUpperValue?: number | null;
  inputMode?: SliderFilterInputModeEnum;
}

export interface UpdateSliderFilterModel {
  filterTool: FilterToolEnum.SLIDER;
  condition?: FilterConditionEnum;
  initialValue?: number | null;
  minimumValue: number;
  maximumValue: number;
  initialLowerValue?: number | null;
  initialUpperValue?: number | null;
  inputMode?: SliderFilterInputModeEnum;
}
