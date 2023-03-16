import { BaseTreeModel } from './base-tree.model';

export interface FlatTreeModel<T = any, TypeDef extends string = string> extends BaseTreeModel<T, TypeDef> {
  level: number;
  expanded: boolean;
  expandable: boolean;
  checkbox: boolean;
  checked: boolean;
}
