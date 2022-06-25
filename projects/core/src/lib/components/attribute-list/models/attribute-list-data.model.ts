import { AttributeListRowModel } from './attribute-list-row.model';
import { AttributeListColumnModel } from './attribute-list-column.model';

export interface AttributeListDataModel {
  id: string;
  tabId: string;
  columns: AttributeListColumnModel[];
  rows: AttributeListRowModel[];
  pageSize: number;
  pageIndex: number;
  totalCount: number | null;
  sortedColumn?: string;
  sortDirection: 'ASC' | 'DESC';
}

