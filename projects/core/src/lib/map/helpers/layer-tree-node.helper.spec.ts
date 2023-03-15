import { LayerTreeNodeHelper } from './layer-tree-node.helper';
import { getAppLayerModel, getLayerTreeNode, LayerTreeNodeModel } from '@tailormap-viewer/api';
import { TreeHelper } from '@tailormap-viewer/shared';

const layers = [
  getAppLayerModel({ id: 1 }),
  getAppLayerModel({ id: 2 }),
  getAppLayerModel({ id: 3 }),
];

const getExtendedLayerTreeNode = (overrides?: Partial<LayerTreeNodeModel>) => {
  const node = getLayerTreeNode(overrides);
  return { ...node, expanded: true, initialChildren: node.childrenIds ?? [] };
};

const nodes = [
  getExtendedLayerTreeNode({ root: true, childrenIds: ['lvl_1'] }),
  getExtendedLayerTreeNode({ id: 'lvl_1', childrenIds: [ 'lvl_2', 'lyr_1', 'lyr_2' ] }),
  getExtendedLayerTreeNode({ id: 'lyr_1', appLayerId: 1 }),
  getExtendedLayerTreeNode({ id: 'lyr_2', appLayerId: 2 }),
  getExtendedLayerTreeNode({ id: 'lvl_2', childrenIds: ['lyr_3'] }),
  getExtendedLayerTreeNode({ id: 'lyr_3', appLayerId: 3 }),
];

describe('LayerTreeNodeHelper', () => {

  test('checks isAppLayerNode', () => {
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerId: null }))).toEqual(false);
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerId: undefined }))).toEqual(false);
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerId: 1 }))).toEqual(true);
  });

  test('gets extended layer tree node', () => {
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerId: null })).expanded).toEqual(true);
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerId: undefined })).expanded).toEqual(true);
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerId: 1 })).expanded).toBeUndefined();
  });

  test('gets TreeModel for LayerTreeNode', () => {
    const treeModel1 = LayerTreeNodeHelper.getTreeModelForLayerTreeNode(getExtendedLayerTreeNode(), layers);
    expect(treeModel1.type).toEqual('level');
    expect(treeModel1.metadata).toEqual(null);

    const treeModel2 = LayerTreeNodeHelper.getTreeModelForLayerTreeNode(getExtendedLayerTreeNode({ appLayerId: 1 }), layers);
    expect(treeModel2.type).toEqual('layer');
    expect(treeModel2.metadata).toEqual(layers[0]);
  });

  test('finds LayerTreeNode', () => {
    const node = TreeHelper.findNode(nodes, 'lvl_2');
    expect(node).not.toBeUndefined();
    expect(node?.id).toEqual('lvl_2');
    const nonExistingNode = TreeHelper.findNode(nodes, 'does_not_exist');
    expect(nonExistingNode).toBeUndefined();
  });

  test('gets all the app layer IDs from a tree', () => {
    const ids = LayerTreeNodeHelper.getAppLayerIds(nodes, nodes[0]);
    expect(ids).toEqual([ 3, 1, 2 ]);
    const ids2 = LayerTreeNodeHelper.getAppLayerIds(nodes, nodes[4]);
    expect(ids2).toEqual([3]);
    const ids3 = LayerTreeNodeHelper.getAppLayerIds(nodes, nodes[5]);
    expect(ids3).toEqual([3]);
  });

  test('gets the selected tree nodes', () => {
    const selectedNodes = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers);
    expect(selectedNodes).toEqual([nodes[1]]);
    const selectedNodes2 = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers.map(l => ({ ...l, visible: false })));
    expect(selectedNodes2).toEqual([]);
    const selectedNodes3 = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers.map(l => ({ ...l, visible: l.id === 3 })));
    expect(selectedNodes3).toEqual([nodes[1]]);
  });

  test('gets the top parent for a layer', () => {
    const topParent = LayerTreeNodeHelper.getTopParent(nodes, layers[0]);
    expect(topParent).toEqual(nodes[1]);
    const topParent2 = LayerTreeNodeHelper.getTopParent(nodes, layers[2]);
    expect(topParent2).toEqual(nodes[1]);
    const nonExisting = LayerTreeNodeHelper.getTopParent(nodes, getAppLayerModel({ id: 5 }));
    expect(nonExisting).toBeUndefined();
  });

  test('gets a tree for nodes', () => {
    const tree = LayerTreeNodeHelper.layerTreeNodeToTree(nodes, layers);
    expect(tree.length).toEqual(1);
    expect(tree[0].children?.length).toEqual(3);
    expect((tree[0].children || [])[0].children?.length).toEqual(1);
    expect(tree[0].id).toEqual('lvl_1');
    expect((tree[0].children || [])[0].id).toEqual('lvl_2');
    expect((tree[0].children || [])[1].id).toEqual('lyr_1');
    expect((tree[0].children || [])[2].id).toEqual('lyr_2');
    expect(((tree[0].children || [])[0].children || [])[0].id).toEqual('lyr_3');
  });

});
