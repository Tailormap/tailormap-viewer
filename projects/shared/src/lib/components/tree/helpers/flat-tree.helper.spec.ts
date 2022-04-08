import { FlatTreeHelper } from './flat-tree.helper';
import { getTreeModelMock } from '../mock-data/tree-model.mock-data';

describe('FlatTreeHelper', () => {

  test('transforms TreeModel to FlatTreeModel', () => {
    expect(FlatTreeHelper.transformer(getTreeModelMock(), 1)).toEqual({
      id: '1',
      label: 'Item 1',
      level: 1,
      expanded: false,
      expandable: false,
      checked: false,
      checkbox: true,
      type: 'test',
      metadata: undefined,
    });
  });

  test('checks if TreeModel has children', () => {
    expect(FlatTreeHelper.hasChildren(getTreeModelMock())).toEqual(false);
    expect(FlatTreeHelper.hasChildren(getTreeModelMock({ children: [ getTreeModelMock() ]}))).toEqual(true);
    expect(FlatTreeHelper.hasChildren(getTreeModelMock({ children: [] }))).toEqual(false);
  });

  test('gets children', () => {
    expect(FlatTreeHelper.getChildren(getTreeModelMock())).toBeUndefined();
    expect(FlatTreeHelper.getChildren(getTreeModelMock({ children: [ getTreeModelMock() ]}))).toEqual([ getTreeModelMock() ]);
    expect(FlatTreeHelper.getChildren(getTreeModelMock({ children: [] }))).toEqual([]);
  });

  test('gets a parent node', () => {
    const nodes = [
      FlatTreeHelper.transformer(getTreeModelMock(), 0),
      FlatTreeHelper.transformer(getTreeModelMock({ id: '2' }), 0),
      FlatTreeHelper.transformer(getTreeModelMock({ id: '2_1' }), 1),
      FlatTreeHelper.transformer(getTreeModelMock({ id: '2_1_1' }), 2),
      FlatTreeHelper.transformer(getTreeModelMock({ id: '2_1_1_1' }), 3),
    ];
    expect(FlatTreeHelper.getParentNode(nodes[0], nodes)).toEqual(null);
    expect(FlatTreeHelper.getParentNode(nodes[2], nodes)).toEqual(nodes[1]);
    expect(FlatTreeHelper.getParentNode(nodes[4], nodes)).toEqual(nodes[3]);
  });

});
