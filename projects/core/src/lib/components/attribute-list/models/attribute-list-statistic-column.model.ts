import { StatisticType } from './attribute-list-api-service.model';

export interface StatisticValueModel {
  type: StatisticType;
  value: string | null;
  label: string;
  isLoading: boolean;
}

export interface AttributeListStatisticColumnModel {
  columnName: string;
  type: StatisticType;
  value: number;
  isLoading: boolean;
  dataType: string;
  hasError?: boolean;
}
