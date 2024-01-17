import { AppLayerModel, LayerTreeNodeModel } from '@tailormap-viewer/api';
import { ExtendedLayerTreeNodeModel } from '../models';
import { TreeHelper, TreeModel, TypesHelper } from '@tailormap-viewer/shared';

export class LayerTreeNodeHelper {

  public static isAppLayerNode(node: LayerTreeNodeModel) {
    return typeof node.appLayerId === 'string';
  }

  public static isLevelNode(node: LayerTreeNodeModel) {
    return typeof node.appLayerId === 'undefined' || node.appLayerId === null;
  }

  public static getExtendedLayerTreeNodes(nodes: LayerTreeNodeModel[], appLayers: AppLayerModel[]): ExtendedLayerTreeNodeModel[] {
    const checkedLayers = new Set(appLayers.filter(a => a.visible).map(a => a.id));
    const checkedNodes = nodes.filter(node => {
      if (LayerTreeNodeHelper.isAppLayerNode(node)) {
        return false;
      }
      return LayerTreeNodeHelper.hasCheckedChildren(node, nodes, checkedLayers);
    });
    const checkedNodeIds = new Set(checkedNodes.map(c => c.id));
    return nodes.map(node => {
      return LayerTreeNodeHelper.getExtendedLayerTreeNode(node, checkedNodeIds.has(node.id));
    });
  }

  private static hasCheckedChildren(node: LayerTreeNodeModel, nodes: LayerTreeNodeModel[], checkedLayers: Set<string>): boolean {
    return (node.childrenIds || []).some(c => {
      const child = nodes.find(n => n.id === c);
      if (child && typeof child.appLayerId === 'string' && checkedLayers.has(child.appLayerId)) {
        return true;
      }
      if (child && child.childrenIds) {
        return LayerTreeNodeHelper.hasCheckedChildren(child, nodes, checkedLayers);
      }
      return false;
    });
  }

  public static getExtendedLayerTreeNode(node: LayerTreeNodeModel, expanded: boolean): ExtendedLayerTreeNodeModel {
    return {
      ...node,
      expanded,
      initialChildren: node.childrenIds ?? [],
    };
  }

  public static getTreeModelForLayerTreeNode(node: ExtendedLayerTreeNodeModel, layers: Map<string, AppLayerModel>): TreeModel<AppLayerModel | null> {
    const isAppLayerNode = LayerTreeNodeHelper.isAppLayerNode(node);
    const layer = typeof node.appLayerId === 'string'
      ? layers.get(node.appLayerId) || null
      : null;
    return {
      id: node.id,
      label: layer ? layer.title : node.name,
      type: isAppLayerNode ? 'layer' : 'level',
      metadata: layer,
      checked: isAppLayerNode
        ? layer?.visible
        : true, // must be boolean but for levels this is determined by the checked status of the layers inside
      expanded: node.expanded,
      expandable: !isAppLayerNode,
    };
  }

  public static getAppLayerIds(layerTreeNodes: LayerTreeNodeModel[], child?: LayerTreeNodeModel): string[] {
    return LayerTreeNodeHelper.getChildNodes(layerTreeNodes, child)
      .map(node => node.appLayerId)
      .filter(TypesHelper.isDefined);
  }

  public static getChildNodeIds(layerTreeNodes: LayerTreeNodeModel[], child?: LayerTreeNodeModel): string[] {
    return LayerTreeNodeHelper.getChildNodes(layerTreeNodes, child).map(node => node.id);
  }

  public static getSelectedTreeNodes(layerTreeNodes: ExtendedLayerTreeNodeModel[], layers: Map<string, AppLayerModel>) {
    const tree = LayerTreeNodeHelper.layerTreeNodeToTree(layerTreeNodes, layers);
    const checkedNodes: Set<string> = new Set();
    tree.forEach(node => {
      let hasCheckedNodes = false;
      const checkCheckedNodes = (child: TreeModel<AppLayerModel | null>) => {
        hasCheckedNodes = (child.type === 'layer' && child.checked) || hasCheckedNodes;
        (child.children || []).forEach(checkCheckedNodes);
      };
      checkCheckedNodes(node);
      (node.children || []).forEach(checkCheckedNodes);
      if (hasCheckedNodes) {
        checkedNodes.add(node.id);
      }
    });
    return layerTreeNodes.filter(node => checkedNodes.has(node.id));
  }

  public static getTopParent(layerTreeNodes: ExtendedLayerTreeNodeModel[], layer: AppLayerModel): LayerTreeNodeModel | undefined {
    const root = layerTreeNodes.find(l => l.root);
    const isLayerNode = (n?: LayerTreeNodeModel) => n?.appLayerId === layer.id;
    const findInChildren = (n?: LayerTreeNodeModel): LayerTreeNodeModel | undefined => (n?.childrenIds || [])
      .map(id => TreeHelper.findNode(layerTreeNodes, id))
      .find(child => isLayerNode(child) || findInChildren(child));
    return findInChildren(root);
  }

  public static layerTreeNodeToTree(layerTreeNodes: ExtendedLayerTreeNodeModel[], layers: Map<string, AppLayerModel>) {
    const root = layerTreeNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    const tree = TreeHelper.traverseTree<TreeModel<AppLayerModel | null>, ExtendedLayerTreeNodeModel>(
      layerTreeNodes,
      root.id,
      (node, children) => ({
        ...LayerTreeNodeHelper.getTreeModelForLayerTreeNode(node, layers),
        children,
      }),
      node => node.childrenIds || [],
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return tree.children || [];
  }

  private static getChildNodes(layerTreeNodes: LayerTreeNodeModel[], child?: LayerTreeNodeModel): LayerTreeNodeModel[] {
    const childIds = (child?.childrenIds || []).map(id => {
      return LayerTreeNodeHelper.getChildNodes(layerTreeNodes, TreeHelper.findNode(layerTreeNodes, id));
    });
    return (child ? [child] : []).concat(...childIds);
  }

}
