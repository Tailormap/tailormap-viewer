import { FilterConditionEnum } from '@tailormap-viewer/api';
import { DateTime } from 'luxon';

export interface InputFilterData {
  condition?: FilterConditionEnum;
  value?: Array<string | DateTime>;
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

export interface FilterData {
  condition?: FilterConditionEnum | string;
  value?: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

export interface OutputFilterData {
  condition: FilterConditionEnum;
  value: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}
