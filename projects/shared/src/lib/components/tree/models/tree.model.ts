import { BaseTreeModel } from './base-tree.model';

export interface TreeModel<T = any, TypeDef extends string = string> extends BaseTreeModel<T, TypeDef> {
  children?: TreeModel<T, TypeDef>[];
}
