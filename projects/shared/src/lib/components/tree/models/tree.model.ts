import { BaseTreeModel } from './base-tree.model';

export interface TreeModel<T = any> extends BaseTreeModel<T> {
  children?: TreeModel<T>[];
}
