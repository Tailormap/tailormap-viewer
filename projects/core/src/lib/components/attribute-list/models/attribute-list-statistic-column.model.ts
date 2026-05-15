import { StatisticType } from './attribute-list-api-service.model';

export interface StatisticValueModel extends AttributeListStatisticColumnModel {
  label: string;
}

export interface AttributeListStatisticColumnModel {
  columnName: string;
  type: StatisticType;
  value: number | null;
  isLoading: boolean;
  dataType: string;
  hasError?: boolean;
}
