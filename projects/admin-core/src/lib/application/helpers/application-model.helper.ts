import { AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';

export class ApplicationModelHelper {

  public static isLevelTreeNode(node: AppTreeNodeModel): node is AppTreeLevelNodeModel {
    return node.objectType === 'AppTreeLevelNode';
  }

  public static isLayerTreeNode(node: AppTreeNodeModel): node is AppTreeLayerNodeModel {
    return node.objectType === 'AppTreeLayerNode';
  }

}
