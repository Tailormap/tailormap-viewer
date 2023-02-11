export interface BaseTreeModel<T = any> {
  id: string;
  label: string;
  checked?: boolean;
  expanded?: boolean;
  expandable?: boolean;
  type?: string;
  metadata?: T;
  loadingPlaceholder?: boolean;
}
