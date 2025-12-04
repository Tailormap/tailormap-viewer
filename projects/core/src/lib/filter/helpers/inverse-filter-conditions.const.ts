import { FilterConditionEnum } from '@tailormap-viewer/api';

export const INVERSE_NUMBER_CONDITIONS: Map<FilterConditionEnum, FilterConditionEnum> = new Map([
  [ FilterConditionEnum.NUMBER_EQUALS_KEY, FilterConditionEnum.NUMBER_NOT_EQUALS_KEY ],
  [ FilterConditionEnum.NUMBER_LARGER_THAN_KEY, FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY ],
  [ FilterConditionEnum.NUMBER_SMALLER_THAN_KEY, FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY ],
  [ FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY, FilterConditionEnum.NUMBER_SMALLER_THAN_KEY ],
  [ FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY, FilterConditionEnum.NUMBER_LARGER_THAN_KEY ],
]);
