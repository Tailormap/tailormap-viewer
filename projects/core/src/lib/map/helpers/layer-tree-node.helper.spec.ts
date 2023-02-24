import { LayerTreeNodeHelper } from './layer-tree-node.helper';
import { getAppLayerModel, getLayerTreeNode } from '@tailormap-viewer/api';

const layers = [
  getAppLayerModel({ name: '1' }),
  getAppLayerModel({ name: '2' }),
  getAppLayerModel({ name: '3' }),
];

const nodes = [
  getLayerTreeNode({ root: true, childrenIds: ['lvl_1'] }),
  getLayerTreeNode({ id: 'lvl_1', childrenIds: [ 'lvl_2', 'lyr_1', 'lyr_2' ] }),
  getLayerTreeNode({ id: 'lyr_1', appLayerName: '1' }),
  getLayerTreeNode({ id: 'lyr_2', appLayerName: '2' }),
  getLayerTreeNode({ id: 'lvl_2', childrenIds: ['lyr_3'] }),
  getLayerTreeNode({ id: 'lyr_3', appLayerName: '3' }),
];

describe('LayerTreeNodeHelper', () => {

  test('checks isAppLayerNode', () => {
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerName: null }))).toEqual(false);
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerName: undefined }))).toEqual(false);
    expect(LayerTreeNodeHelper.isAppLayerNode(getLayerTreeNode({ appLayerName: '1' }))).toEqual(true);
  });

  test('gets extended layer tree node', () => {
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerName: null })).expanded).toEqual(true);
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerName: undefined })).expanded).toEqual(true);
    expect(LayerTreeNodeHelper.getExtendedLayerTreeNode(getLayerTreeNode({ appLayerName: '1' })).expanded).toBeUndefined();
  });

  test('gets TreeModel for LayerTreeNode', () => {
    const treeModel1 = LayerTreeNodeHelper.getTreeModelForLayerTreeNode(getLayerTreeNode(), layers);
    expect(treeModel1.type).toEqual('level');
    expect(treeModel1.metadata).toEqual(null);

    const treeModel2 = LayerTreeNodeHelper.getTreeModelForLayerTreeNode(getLayerTreeNode({ appLayerName: '1' }), layers);
    expect(treeModel2.type).toEqual('layer');
    expect(treeModel2.metadata).toEqual(layers[0]);
  });

  test('finds LayerTreeNode', () => {
    const node = LayerTreeNodeHelper.findLayerTreeNode(nodes, 'lvl_2');
    expect(node).not.toBeUndefined();
    expect(node?.id).toEqual('lvl_2');
    const nonExistingNode = LayerTreeNodeHelper.findLayerTreeNode(nodes, 'does_not_exist');
    expect(nonExistingNode).toBeUndefined();
  });

  test('gets all the app layer IDs from a tree', () => {
    const names = LayerTreeNodeHelper.getAppLayerNames(nodes, nodes[0]);
    expect(names).toEqual([ '3', '1', '2' ]);
    const names2 = LayerTreeNodeHelper.getAppLayerNames(nodes, nodes[4]);
    expect(names2).toEqual(['3']);
    const names3 = LayerTreeNodeHelper.getAppLayerNames(nodes, nodes[5]);
    expect(names3).toEqual(['3']);
  });

  test('gets the selected tree nodes', () => {
    const selectedNodes = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers);
    expect(selectedNodes).toEqual([nodes[1]]);
    const selectedNodes2 = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers.map(l => ({ ...l, visible: false })));
    expect(selectedNodes2).toEqual([]);
    const selectedNodes3 = LayerTreeNodeHelper.getSelectedTreeNodes(nodes, layers.map(l => ({ ...l, visible: l.name === '3' })));
    expect(selectedNodes3).toEqual([nodes[1]]);
  });

  test('gets the top parent for a layer', () => {
    const topParent = LayerTreeNodeHelper.getTopParent(nodes, layers[0]);
    expect(topParent).toEqual(nodes[1]);
    const topParent2 = LayerTreeNodeHelper.getTopParent(nodes, layers[2]);
    expect(topParent2).toEqual(nodes[1]);
    const nonExisting = LayerTreeNodeHelper.getTopParent(nodes, getAppLayerModel({ name: '5' }));
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
