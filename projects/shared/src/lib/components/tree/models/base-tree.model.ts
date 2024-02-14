export interface BaseTreeModel<T = any, TypeDef extends string = string> {
  id: string;
  label: string;
  checked?: boolean;
  expanded?: boolean;
  expandable?: boolean;
  type?: TypeDef;
  metadata?: T;
  loadingPlaceholder?: boolean;
  className?: string;
}
