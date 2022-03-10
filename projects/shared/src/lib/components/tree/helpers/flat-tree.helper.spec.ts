import { FlatTreeHelper } from './flat-tree.helper';
import { TreeModel } from '../models';

describe('FlatTreeHelper', () => {

  const getTreeModel = (overrides?: Partial<TreeModel>): TreeModel => ({
    id: '1',
    label: 'Item 1',
    type: 'test',
    children: undefined,
    metadata: undefined,
    readOnlyItem: false,
    checked: false,
    expanded: false,
    ...overrides,
  });

  test('transforms TreeModel to FlatTreeModel', () => {
    expect(FlatTreeHelper.transformer(getTreeModel(), 1)).toEqual({
      id: '1',
      label: 'Item 1',
      level: 1,
      expanded: false,
      expandable: false,
      checked: false,
      checkbox: true,
      type: 'test',
      metadata: undefined,
      readOnlyItem: false,
    });
  });

  test('checks if TreeModel has children', () => {
    expect(FlatTreeHelper.hasChildren(getTreeModel())).toEqual(false);
    expect(FlatTreeHelper.hasChildren(getTreeModel({ children: [ getTreeModel() ]}))).toEqual(true);
    expect(FlatTreeHelper.hasChildren(getTreeModel({ children: [] }))).toEqual(true);
  });

  test('gets children', () => {
    expect(FlatTreeHelper.getChildren(getTreeModel())).toBeUndefined();
    expect(FlatTreeHelper.getChildren(getTreeModel({ children: [ getTreeModel() ]}))).toEqual([ getTreeModel() ]);
    expect(FlatTreeHelper.getChildren(getTreeModel({ children: [] }))).toEqual([]);
  });

  test('gets a parent node', () => {
    const nodes = [
      FlatTreeHelper.transformer(getTreeModel(), 0),
      FlatTreeHelper.transformer(getTreeModel({ id: '2' }), 0),
      FlatTreeHelper.transformer(getTreeModel({ id: '2_1' }), 1),
      FlatTreeHelper.transformer(getTreeModel({ id: '2_1_1' }), 2),
      FlatTreeHelper.transformer(getTreeModel({ id: '2_1_1_1' }), 3),
    ];
    expect(FlatTreeHelper.getParentNode(nodes[0], nodes)).toEqual(null);
    expect(FlatTreeHelper.getParentNode(nodes[2], nodes)).toEqual(nodes[1]);
    expect(FlatTreeHelper.getParentNode(nodes[4], nodes)).toEqual(nodes[3]);
  });

});
