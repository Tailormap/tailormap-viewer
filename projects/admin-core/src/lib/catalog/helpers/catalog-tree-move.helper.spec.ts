import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { MoveCatalogNodeModel } from '../models/move-catalog-node.model';
import { baseTree, CatalogTestNode, getCatalogTree } from './mocks/catalog-tree.mock';
import { CatalogTreeMoveHelper } from './catalog-tree-move.helper';

const matchesTree = (move: MoveCatalogNodeModel, tree: CatalogTestNode[], changedItems: CatalogTestNode[]) => {
  const catalogTree = getCatalogTree(tree);
  const expectedTree = tree.map(node => {
    const changedNode = changedItems.find(n => n.id === node.id);
    return changedNode ? { ...node, ...changedNode } : node;
  });
  const expectedCatalogTree = getCatalogTree(expectedTree);
  const result = CatalogTreeMoveHelper.moveNode(catalogTree, move);
  expect(result).toEqual(expectedCatalogTree);
};

describe('CatalogTreeMoveHelper', () => {

  it('should move node inside node', () => {
    const changedItems: CatalogTestNode[] = [
      { id: 'root', children: [ '2', '3' ] },
      { id: '2', children: ['1'] },
    ];
    const moveEvt: MoveCatalogNodeModel = { node: '1', nodeType: 'node', sibling: '2', siblingType: 'node', position: 'inside', fromParent: null, toParent: '2' };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move node between node', () => {
    const changedItems: CatalogTestNode[] = [
      { id: 'root', children: [ '2', '1', '3' ] },
    ];
    const moveEvt: MoveCatalogNodeModel = { node: '1', nodeType: 'node', sibling: '2', siblingType: 'node', position: 'after', fromParent: null, toParent: null };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move node to root', () => {
    const changedItems: CatalogTestNode[] = [
      { id: 'root', children: [ '1', '2', '1_1', '3' ] },
      { id: '1', children: ['1_2'] },
    ];
    const moveEvt: MoveCatalogNodeModel = { node: '1_1', nodeType: 'node', sibling: '2', siblingType: 'node', position: 'after', fromParent: '1', toParent: null };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move item to root', () => {
    const changedItems: CatalogTestNode[] = [
      {
        id: 'root',
        items: [{ id: 's1', kind: CatalogItemKindEnum.GEO_SERVICE }],
      },
      {
        id: '1_1',
        items: [
          { id: 's2', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 's3', kind: CatalogItemKindEnum.GEO_SERVICE },
        ],
      },
    ];
    const moveEvt: MoveCatalogNodeModel = {
      node: 's1',
      nodeType: CatalogItemKindEnum.GEO_SERVICE,
      sibling: '2',
      siblingType: 'node',
      position: 'after',
      fromParent: '1_1',
      toParent: null,
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move item to other folder', () => {
    const changedItems: CatalogTestNode[] = [
      {
        id: '2',
        items: [{ id: 's1', kind: CatalogItemKindEnum.GEO_SERVICE }],
      },
      {
        id: '1_1',
        items: [
          { id: 's2', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 's3', kind: CatalogItemKindEnum.GEO_SERVICE },
        ],
      },
    ];
    const moveEvt: MoveCatalogNodeModel = {
      node: 's1',
      nodeType: CatalogItemKindEnum.GEO_SERVICE,
      sibling: '2',
      siblingType: 'node',
      position: 'inside',
      fromParent: '1_1',
      toParent: '2',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move item before other item in same folder', () => {
    const changedItems: CatalogTestNode[] = [
      {
        id: '1_1',
        items: [
          { id: 's2', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 's1', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 's3', kind: CatalogItemKindEnum.GEO_SERVICE },
        ],
      },
    ];
    const moveEvt: MoveCatalogNodeModel = {
      node: 's1',
      nodeType: CatalogItemKindEnum.GEO_SERVICE,
      sibling: 's3',
      siblingType: CatalogItemKindEnum.GEO_SERVICE,
      position: 'before',
      fromParent: '1_1',
      toParent: '1_1',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('should move item after other item in other folder', () => {
    const changedItems: CatalogTestNode[] = [
      {
        id: '1_1',
        items: [
          { id: 's1', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 's3', kind: CatalogItemKindEnum.GEO_SERVICE },
        ],
      },
      {
        id: '1_2',
        items: [
          { id: 'f1', kind: CatalogItemKindEnum.FEATURE_SOURCE },
          { id: 'f2', kind: CatalogItemKindEnum.FEATURE_SOURCE },
          { id: 's2', kind: CatalogItemKindEnum.GEO_SERVICE },
          { id: 'f3', kind: CatalogItemKindEnum.FEATURE_SOURCE },
        ],
      },
    ];
    const moveEvt: MoveCatalogNodeModel = {
      node: 's2',
      nodeType: CatalogItemKindEnum.GEO_SERVICE,
      sibling: 'f2',
      siblingType: CatalogItemKindEnum.FEATURE_SOURCE,
      position: 'after',
      fromParent: '1_1',
      toParent: '1_2',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('illegal move of node inside service should not change catalog', () => {
    const changedItems: CatalogTestNode[] = [];
    const moveEvt: MoveCatalogNodeModel = {
      node: '1',
      nodeType: 'node',
      sibling: 's2',
      siblingType: CatalogItemKindEnum.GEO_SERVICE,
      position: 'inside',
      fromParent: null,
      toParent: 's2',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('illegal move of node inside itself should not change catalog', () => {
    const changedItems: CatalogTestNode[] = [];
    const moveEvt: MoveCatalogNodeModel = {
      node: '1_1',
      nodeType: 'node',
      sibling: '1_1',
      siblingType: 'node',
      position: 'inside',
      fromParent: '1',
      toParent: '1',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

  it('illegal move of node inside a child node should not change catalog', () => {
    const changedItems: CatalogTestNode[] = [];
    const moveEvt: MoveCatalogNodeModel = {
      node: '1',
      nodeType: 'node',
      sibling: '1_1',
      siblingType: 'node',
      position: 'inside',
      fromParent: '1',
      toParent: '1_1',
    };
    matchesTree(moveEvt, baseTree, changedItems);
  });

});
