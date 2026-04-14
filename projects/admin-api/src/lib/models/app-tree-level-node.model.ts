import { AppTreeNodeModel } from './app-tree-node.model';
import { ExpandOnStartupEnum } from '@tailormap-viewer/api';

export interface AppTreeLevelNodeModel extends AppTreeNodeModel {
  childrenIds: string[];
  root: boolean;
  title: string;
  expandOnStartup?: ExpandOnStartupEnum;
}
