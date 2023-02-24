import { AttributeListRowModel } from './attribute-list-row.model';
import { AttributeListColumnModel } from './attribute-list-column.model';

export interface LoadAttributeListDataResultModel {
  id: string;
  layerName?: string;
  success: boolean;
  errorMessage?: string;
  totalCount: number | null;
  columns: AttributeListColumnModel[];
  rows: AttributeListRowModel[];
}
