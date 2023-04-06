import { AppTreeNodeModel } from './app-tree-node.model';

export interface AppTreeLayerNodeModel extends AppTreeNodeModel {
  serviceId: string;
  layerName: string;
  visible: boolean;
}
