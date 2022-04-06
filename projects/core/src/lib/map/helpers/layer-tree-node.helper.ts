import { AppLayerModel, LayerTreeNodeModel } from '@tailormap-viewer/api';
import { ExtendedLayerTreeNodeModel } from '../models';
import { TreeModel } from '@tailormap-viewer/shared';

export class LayerTreeNodeHelper {

  public static isAppLayerNode(node: LayerTreeNodeModel) {
    return typeof node.appLayerId !== 'undefined';
  }

  public static getExtendedLayerTreeNode(node: LayerTreeNodeModel): ExtendedLayerTreeNodeModel {
    if (LayerTreeNodeHelper.isAppLayerNode(node)) {
      return node;
    }
    return {
      ...node,
      expanded: true,
    };
  }

  public static getTreeModelForLayerTreeNode(node: ExtendedLayerTreeNodeModel, layers?: AppLayerModel[]): TreeModel {
    const isAppLayerNode = LayerTreeNodeHelper.isAppLayerNode(node);
    const layer = isAppLayerNode
      ? (layers || []).find(l => l.id === node.appLayerId)
      : null;
    return {
      id: node.id,
      label: node.name,
      type: isAppLayerNode ? 'layer' : 'level',
      metadata: layer,
      checked: isAppLayerNode
        ? layer?.visible
        : true, // must be boolean but for levels this is determined by the checked status of the layers inside
      expanded: node.expanded,
    };
  }

}
