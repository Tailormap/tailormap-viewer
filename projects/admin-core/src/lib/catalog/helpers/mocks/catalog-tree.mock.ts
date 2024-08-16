import {
  CatalogItemKindEnum, CatalogItemModel, getCatalogNode, getFeatureSource, getFeatureType, getGeoService, getGeoServiceLayer,
} from '@tailormap-admin/admin-api';
import { ExtendedCatalogNodeModel } from '../../models/extended-catalog-node.model';
import { ExtendedCatalogModelHelper } from '../extended-catalog-model.helper';
import { ExtendedGeoServiceModel } from '../../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../../models/extended-feature-type.model';

export type CatalogTestNode = { id: string; children?: string[]; items?: CatalogItemModel[] };

const getFolderNode = (id: string, parentId?: string, children?: string[], items?: CatalogItemModel[]): ExtendedCatalogNodeModel => {
  return {
    ...getCatalogNode({ root: id === 'root', title: `Folder ${id}`, id, children, items }),
    expanded: false,
    parentId: parentId || null,
  };
};

export const getCatalogTree = (tree: CatalogTestNode[]): ExtendedCatalogNodeModel[] => {
  const catalog: ExtendedCatalogNodeModel[] = [];
  tree.forEach(node => {
    const parentId = tree.find(n => n.children?.includes(node.id))?.id;
    catalog.push(getFolderNode(node.id, parentId, node.children, node.items));
  });
  return catalog;
};

export const baseTree: CatalogTestNode[] = [
  { id: 'root', children: [ '1', '2', '3' ], items: [] },
  { id: '1', children: [ '1_1', '1_2' ], items: [] },
  {
    id: '1_1',
    items: [
      { id: 's1', kind: CatalogItemKindEnum.GEO_SERVICE },
      { id: 's2', kind: CatalogItemKindEnum.GEO_SERVICE },
      { id: 's3', kind: CatalogItemKindEnum.GEO_SERVICE },
    ],
  },
  {
    id: '1_2',
    items: [
      { id: 'f1', kind: CatalogItemKindEnum.FEATURE_SOURCE },
      { id: 'f2', kind: CatalogItemKindEnum.FEATURE_SOURCE },
      { id: 'f3', kind: CatalogItemKindEnum.FEATURE_SOURCE },
    ],
  },
  { id: '2' },
  { id: '3' },
];

const geoServicesAndLayers = [
  { id: 's1', title: 'Geo Service Background', layers: [{ id: '1', name: 'OSM', title: 'OSM' }] },
  {
    id: 's2',
    title: 'Important service',
    layers: [{ id: '1', name: 'Layer 1', title: 'The important one', crs: ['EPSG:3857'] }, { id: '2', name: 'Layer 2', title: 'The next important one', crs: ['EPSG:3857'] }],
  },
  { id: 's3', title: 'Bad service', layers: [{ id: '1', name: 'Bad layer', title: 'Bad layer' }, { id: '2', name: 'Worst layer', title: 'Worst layer' }] },
]
  .map(s => ({ ...getGeoService(s), layers: s.layers.map(l => getGeoServiceLayer({ ...l, crs: l.crs || ['EPSG:28992'] })) }))
  .map(s => ExtendedCatalogModelHelper.getExtendedGeoService(s));

const featureSourceAndTypes = [
  { id: 'f1', title: 'JDBC source', featureTypes: [{ id: '1', name: 'layer1', title: 'Layer 1 source' }] },
  { id: 'f2', title: 'SQL Server source', featureTypes: [{ id: '1', name: 'CAPS', title: 'CAPS' }, { id: '2', name: 'SECOND', title: 'SECOND' }] },
  { id: 'f3', title: 'Oracle', featureTypes: [{ id: '1', name: 'bla', title: 'bla' }, { id: '2', name: 'blah', title: 'blah' }] },
]
  .map(s => ({ ...getFeatureSource(s), featureTypes: s.featureTypes.map(l => getFeatureType(l)) }))
  .map(f => ExtendedCatalogModelHelper.getExtendedFeatureSource(f));

export const getFullCatalogTreeData = (): {
  catalogTree: ExtendedCatalogNodeModel[];
  geoServices: ExtendedGeoServiceModel[];
  geoServiceLayers: ExtendedGeoServiceLayerModel[];
  featureSources: ExtendedFeatureSourceModel[];
  featureTypes: ExtendedFeatureTypeModel[];
} => {
  return {
    catalogTree: getCatalogTree(baseTree),
    geoServices: geoServicesAndLayers.map(([service]) => service),
    geoServiceLayers: geoServicesAndLayers.map(([ _service, layers ]) => layers).flat(),
    featureSources: featureSourceAndTypes.map(([source]) => source),
    featureTypes: featureSourceAndTypes.map(([ _source, types ]) => types).flat(),
  };
};
