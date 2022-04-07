export interface BaseTreeModel<T = any> {
  id: string;
  label: string;
  checked?: boolean;
  expanded?: boolean;
  type?: string;
  metadata?: T;
}
