import { AttributeListRowModel } from './attribute-list-row.model';

export interface LoadAttributeListDataResultModel {
  id: string;
  layerId?: string;
  success: boolean;
  errorMessage?: string;
  totalCount: number;
  rows: AttributeListRowModel[];
}
