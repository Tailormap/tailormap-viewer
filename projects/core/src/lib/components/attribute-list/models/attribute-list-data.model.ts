import { AttributeListRowModel } from './attribute-list-row.model';
import { AttributeListColumnModel } from './attribute-list-column.model';

export interface AttributeListDataModel {
  id: string;
  tabId: string;
  featureType?: string;
  columns: AttributeListColumnModel[];
  rows: AttributeListRowModel[];
  checkedRows: { id: string; __fid: string }[];
  selectedRowId?: string;
  pageSize: number;
  /** 1-based index of the page to show. Updated when another page is requested, before it is loaded. */
  pageIndex: number;
  /**
   * 1-based index of the page the rows are from. While another page loads, the rows (and the paginator showing them) are still
   * those of this page. Undefined before the first page is loaded.
   */
  loadedPageIndex?: number;
  totalCount: number | null;
  sortedColumn?: string;
  sortDirection: 'asc' | 'desc' | '';
  errorMessage?: string;
}

