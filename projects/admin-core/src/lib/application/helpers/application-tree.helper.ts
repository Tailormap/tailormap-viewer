import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { AppLayerSettingsModel, AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from './application-model.helper';
import { ApplicationService } from '../services/application.service';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';

export class ApplicationTreeHelper {

  public static isLevelTreeNode(node?: TreeModel<AppTreeNodeModel> | null): node is TreeModel<AppTreeLevelNodeModel> {
    return !!(node && node.metadata && ApplicationModelHelper.isLevelTreeNode(node.metadata));
  }

  public static isLayerTreeNode(node?: TreeModel<AppTreeNodeModel> | null): node is TreeModel<AppTreeLayerNodeModel> {
    return !!(node && node.metadata && ApplicationModelHelper.isLayerTreeNode(node.metadata));
  }

  public static layerTreeNodeToTree(
    layerTreeNodes: AppTreeNodeModel[],
    layers: ExtendedGeoServiceLayerModel[],
    expandedNodes: string[],
    layerSettings: Record<string, AppLayerSettingsModel> | null,
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
        ...ApplicationTreeHelper.getTreeModelForLayerTreeNode(node, layers, expandedNodes, layerSettings, baseLayerTree),
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
    expandedNodes: string[],
    layerSettings: Record<string, AppLayerSettingsModel> | null,
    baseLayerTree?: boolean,
  ): TreeModel<AppTreeNodeModel> {
    const layer = ApplicationModelHelper.isLayerTreeNode(node)
      ? layers.find(l => l.name === node.layerName && l.serviceId === node.serviceId) || null
      : null;
    let label = '';
    if (ApplicationModelHelper.isLevelTreeNode(node)) {
      label = node.root
        ? (baseLayerTree ? ApplicationService.ROOT_BASE_NODE_TITLE : ApplicationService.ROOT_NODE_TITLE)
        : node.title;
    }
    if (ApplicationModelHelper.isLayerTreeNode(node)) {
      const layerSettingTitle = layerSettings?.[node.id]?.title;
      label = layerSettingTitle || layer?.layerSettings?.title || layer?.title || node.layerName;
    }
    return {
      id: node.id,
      label,
      type: ApplicationModelHelper.isLayerTreeNode(node) ? 'layer' : 'level',
      metadata: node,
      checked: ApplicationModelHelper.isLayerTreeNode(node)
        ? node.visible
        : true, // must be boolean but for levels this is determined by the checked status of the layers inside
      expanded: expandedNodes.includes(node.id),
      expandable: ApplicationModelHelper.isLevelTreeNode(node),
    };
  }

}
