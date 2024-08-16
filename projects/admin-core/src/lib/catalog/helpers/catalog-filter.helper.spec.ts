import { getFullCatalogTreeData } from './mocks/catalog-tree.mock';
import { CatalogFilterHelper } from './catalog-filter.helper';
import { CatalogTreeModel } from '../models/catalog-tree.model';

type MatchTreeNode = { id: string; label: string; children?: MatchTreeNode[] };

const matchesTree = (tree: CatalogTreeModel[], matchTree: MatchTreeNode[]): boolean => {
  expect(tree.map(t => t.id)).toEqual(matchTree.map(t => t.id));
  return tree.every((t, idx) => {
    const match = t.id === matchTree[idx].id && t.label === matchTree[idx].label;
    expect(t.id).toEqual(matchTree[idx].id);
    expect(t.label).toEqual(matchTree[idx].label);
    if (t.children) {
      return match && matchesTree(t.children, matchTree[idx].children || []);
    }
    return match;
  });
};

describe('CatalogFilterHelper', () => {

  test('builds a tree for catalog', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      undefined,
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_1', label: 'Folder 1_1', children: [
              {
                id: 'service-s1', label: 'Geo Service Background', children: [
                  { id: 'layer-s1_1', label: 'OSM' },
                ],
              },
              {
                id: 'service-s2', label: 'Important service', children: [
                  { id: 'layer-s2_1', label: 'The important one' },
                  { id: 'layer-s2_2', label: 'The next important one' },
                ],
              },
              {
                id: 'service-s3', label: 'Bad service', children: [
                  { id: 'layer-s3_1', label: 'Bad layer' },
                  { id: 'layer-s3_2', label: 'Worst layer' },
                ],
              },
            ],
          },
          {
            id: 'catalog-1_2', label: 'Folder 1_2', children: [
              {
                id: 'feature-source-f1', label: 'JDBC source', children: [
                  { id: 'feature-type-f1_1', label: 'Layer 1 source' },
                ],
              },
              {
                id: 'feature-source-f2', label: 'SQL Server source', children: [
                  { id: 'feature-type-f2_1', label: 'CAPS' },
                  { id: 'feature-type-f2_2', label: 'SECOND' },
                ],
              },
              {
                id: 'feature-source-f3', label: 'Oracle', children: [
                  { id: 'feature-type-f3_1', label: 'bla' },
                  { id: 'feature-type-f3_2', label: 'blah' },
                ],
              },
            ],
          },
        ],
      },
      { id: 'catalog-2', label: 'Folder 2' },
      { id: 'catalog-3', label: 'Folder 3' },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree for catalog searching for a layer', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      'Background',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_1', label: 'Folder 1_1', children: [
              {
                id: 'service-s1', label: 'Geo Service Background',
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree for catalog searching for a service', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      'The next',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_1', label: 'Folder 1_1', children: [
              {
                id: 'service-s2', label: 'Important service', children: [
                  { id: 'layer-s2_2', label: 'The next important one' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree for catalog searching for a feature type', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      'bla',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_2', label: 'Folder 1_2', children: [
              {
                id: 'feature-source-f3', label: 'Oracle', children: [
                  { id: 'feature-type-f3_1', label: 'bla' },
                  { id: 'feature-type-f3_2', label: 'blah' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree for catalog searching for a feature source', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      'Oracle',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_2', label: 'Folder 1_2', children: [
              {
                id: 'feature-source-f3', label: 'Oracle',
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree for catalog searching for a catalog node', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByFilterTerm(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureSources,
      treeData.featureTypes,
      'Folder 2',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_2', label: 'Folder 1_2',
          },
        ],
      },
      { id: 'catalog-2', label: 'Folder 2' },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree with crs filter', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByCrs(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureTypes,
      'EPSG:28992',
      undefined,
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_1', label: 'Folder 1_1', children: [
              {
                id: 'service-s1', label: 'Geo Service Background', children: [
                  { id: 'layer-s1_1', label: 'OSM' },
                ],
              },
              {
                id: 'service-s3', label: 'Bad service', children: [
                  { id: 'layer-s3_1', label: 'Bad layer' },
                  { id: 'layer-s3_2', label: 'Worst layer' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

  test('builds a tree with crs filter and filter term', () => {
    const treeData = getFullCatalogTreeData();
    const filteredTree = CatalogFilterHelper.filterTreeByCrs(
      treeData.catalogTree,
      treeData.geoServices,
      treeData.geoServiceLayers,
      treeData.featureTypes,
      'EPSG:28992',
      'worst',
    );
    const expectedTree: MatchTreeNode[] = [
      {
        id: 'catalog-1', label: 'Folder 1', children: [
          {
            id: 'catalog-1_1', label: 'Folder 1_1', children: [
              {
                id: 'service-s3', label: 'Bad service', children: [
                  { id: 'layer-s3_2', label: 'Worst layer' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(matchesTree(filteredTree, expectedTree)).toEqual(true);
  });

});
