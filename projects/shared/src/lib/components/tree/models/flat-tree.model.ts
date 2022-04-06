import { BaseTreeModel } from './base-tree.model';

export interface FlatTreeModel<T = any> extends BaseTreeModel<T> {
  level: number;
  expanded: boolean;
  expandable: boolean;
  checkbox: boolean;
  checked: boolean;
}
