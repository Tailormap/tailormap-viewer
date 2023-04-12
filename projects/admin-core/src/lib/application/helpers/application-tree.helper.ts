import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from './application-model.helper';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ApplicationService } from '../services/application.service';

export class ApplicationTreeHelper {

  public static layerTreeNodeToTree(
    layerTreeNodes: AppTreeNodeModel[],
    layers: ExtendedGeoServiceLayerModel[],
    baseLayerTree?: boolean,
  ): TreeModel<AppTreeNodeModel>[] {
    const root = layerTreeNodes.find(l => ApplicationModelHelper.isLevelTreeNode(l) && l.root);
    if (!root) {
      return [];
    }
    const tree = TreeHelper.traverseTree<TreeModel<AppTreeNodeModel>, AppTreeNodeModel>(
      layerTreeNodes,
      root.id,
      (node, children) => ({
        ...ApplicationTreeHelper.getTreeModelForLayerTreeNode(node, layers, baseLayerTree),
        children,
      }),
      node => ApplicationModelHelper.isLevelTreeNode(node) ? node.childrenIds : [],
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return [tree];
  }

  public static getTreeModelForLayerTreeNode(
    node: AppTreeNodeModel,
    layers: ExtendedGeoServiceLayerModel[],
    baseLayerTree?: boolean,
  ): TreeModel<AppTreeNodeModel> {
    const isAppLayerNode = ApplicationModelHelper.isLayerTreeNode(node);
    const isAppLevelNode = ApplicationModelHelper.isLevelTreeNode(node);
    const layer = isAppLayerNode
      ? layers.find(l => l.name === node.layerName && l.serviceId === node.serviceId) || null
      : null;
    let label = '';
    if (isAppLevelNode) {
      label = node.root
        ? (baseLayerTree ? ApplicationService.ROOT_BACKGROUND_NODE_TITLE : ApplicationService.ROOT_NODE_TITLE)
        : node.title;
    }
    if (isAppLayerNode) {
      label = layer?.title || node.layerName;
    }
    return {
      id: node.id,
      label,
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
