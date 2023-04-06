import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from './application-model.helper';

export class ApplicationTreeHelper {

  public static layerTreeNodeToTree(layerTreeNodes: AppTreeNodeModel[]) {
    const root = layerTreeNodes.find(l => ApplicationModelHelper.isLevelTreeNode(l) && l.root);
    if (!root) {
      return [];
    }
    const tree = TreeHelper.traverseTree<TreeModel<AppTreeNodeModel>, AppTreeNodeModel>(
      layerTreeNodes,
      root.id,
      (node, children) => ({
        ...ApplicationTreeHelper.getTreeModelForLayerTreeNode(node),
        children,
      }),
      node => ApplicationModelHelper.isLevelTreeNode(node) ? node.childrenIds : [],
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return tree.children || [];
  }

  public static getTreeModelForLayerTreeNode(node: AppTreeNodeModel): TreeModel {
    const isAppLayerNode = ApplicationModelHelper.isLayerTreeNode(node);
    const isAppLevelNode = ApplicationModelHelper.isLevelTreeNode(node);
    return {
      id: node.id,
      label: isAppLevelNode ? node.title : node.id,
      type: isAppLayerNode ? 'layer' : 'level',
      metadata: node,
      checked: isAppLayerNode
        ? node.visible
        : true, // must be boolean but for levels this is determined by the checked status of the layers inside
      expanded: true,
      expandable: isAppLevelNode,
    };
  }

}
