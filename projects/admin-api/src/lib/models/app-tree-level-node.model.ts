import { AppTreeNodeModel } from './app-tree-node.model';

export interface AppTreeLevelNodeModel extends AppTreeNodeModel {
  childrenIds: string[];
  root: boolean;
  title: string;
}
