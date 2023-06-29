import {
  AppLayerModel, ViewerResponseModel, BoundsModel, ComponentModel, CoordinateReferenceSystemModel, GeometryType, Language, LayerDetailsModel,
  MapResponseModel, ServerType, ServiceModel, ServiceProtocol, UserResponseModel, VersionResponseModel,
} from '../models';
import { FeatureModel } from '../models/feature.model';
import { ColumnMetadataModel } from '../models/column-metadata.model';
import { FeatureAttributeTypeEnum } from '../models/feature-attribute-type.enum';
import { FeaturesResponseModel } from '../models/features-response.model';
import { LayerTreeNodeModel } from '../models/layer-tree-node.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';

export const getVersionResponseModel = (overrides?: VersionResponseModel): VersionResponseModel => ({
  version: '0.1-SNAPSHOT',
  databaseversion: '47',
  apiVersion: 'v1',
  ...overrides,
});

export const getUserResponseModel = (overrides?: Partial<UserResponseModel>): UserResponseModel => ({
  isAuthenticated: false,
  username: '',
  roles: [],
  ...overrides,
});

export const getBoundsModel = (overrides?: Partial<BoundsModel>): BoundsModel => ({
  minx: 123180,
  miny: 445478,
  maxx: 149359,
  maxy: 463194,
  crs: 'EPSG:28992',
  ...overrides,
});

export const getCrsModel = (overrides?: Partial<CoordinateReferenceSystemModel>): CoordinateReferenceSystemModel => ({
  code: 'EPSG:28992',
  // eslint-disable-next-line max-len
  definition: '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs',
  area: getBoundsModel(overrides?.area),
  ...overrides,
});

export const getLayerTreeNode = (overrides?: Partial<LayerTreeNodeModel>): LayerTreeNodeModel => ({
  id: 'root',
  root: true,
  name: 'Root',
  childrenIds: [],
  ...overrides,
});

export const getAppLayerModel = (overrides?: Partial<AppLayerModel>): AppLayerModel => ({
  id: '1',
  serviceId: '1',
  visible: true,
  hasAttributes: false,
  editable: false,
  title: 'Test',
  layerName: 'test',
  opacity: 100,
  ...overrides,
});

export const getServiceModel = (overrides?: Partial<ServiceModel>): ServiceModel => ({
  id: 'myservice',
  url: 'https://test.nl',
  protocol: ServiceProtocol.WMS,
  serverType: ServerType.GEOSERVER,
  ...overrides,
});

export const getLayerDetailsModel = (overrides?: Partial<LayerDetailsModel>): LayerDetailsModel => ({
  id: '1',
  serviceId: 1,
  relations: [],
  geometryType: GeometryType.GEOMETRY,
  geometryAttributeIndex: 1,
  geometryAttribute: 'geom',
  metadata: null,
  featuretypeName: 'test',
  editable: false,
  attributes: [],
  ...overrides,
});

export const getComponentModel = (overrides?: Partial<ComponentModel>): ComponentModel => ({
  config: {
    enabled: true,
  },
  type: 'test',
  ...overrides,
});

export const getFeatureModel = (overrides?: Partial<FeatureModel>): FeatureModel => ({
  __fid: '1',
  attributes: {
    prop1: 'test',
    prop2: 'another test',
  },
  ...overrides,
});

export const getColumnMetadataModel = (overrides?: Partial<ColumnMetadataModel>): ColumnMetadataModel => ({
  type: FeatureAttributeTypeEnum.STRING,
  key: 'prop1',
  alias: 'Property 1',
  ...overrides,
});

export const getFeaturesResponseModel = (overrides?: Partial<FeaturesResponseModel>): FeaturesResponseModel => {
  const features: Partial<FeatureModel>[] = [
    { __fid: '1', attributes: { object_id: '0606100000013912',  valid_from: '2010-06-29', year: 1960, status: 'Pand in gebruik' } },
    { __fid: '2', attributes: { object_id: '0606100000017812',  valid_from: '2014-10-06', year: 2001, status: 'Pand in gebruik' } },
    { __fid: '3', attributes: { object_id: '0622100000041685',  valid_from: '1929-01-22', year: 1989, status: 'Pand in gebruik' } },
    { __fid: '4', attributes: { object_id: '0622100000041686',  valid_from: '1929-01-22', year: 1989, status: 'Pand in gebruik' } },
    { __fid: '5', attributes: { object_id: '0622100000041687',  valid_from: '1931-05-15', year: 1983, status: 'Pand in gebruik' } },
    { __fid: '6', attributes: { object_id: '0622100000041688',  valid_from: '2007-05-02', year: 1900, status: 'Pand in gebruik' } },
    { __fid: '7', attributes: { object_id: '0622100000041689',  valid_from: '2016-04-19', year: 1700, status: 'Pand in gebruik' } },
    { __fid: '8', attributes: { object_id: '0622100000041690',  valid_from: '2015-05-20', year: 1700, status: 'Pand in gebruik' } },
  ];
  const columnMetadata: Partial<ColumnMetadataModel>[] = [
    { key: 'object_id', alias: 'Pand', type: FeatureAttributeTypeEnum.STRING },
    { key: 'valid_from', alias: 'Geldig vanaf', type: FeatureAttributeTypeEnum.DATE },
    { key: 'year', alias: 'Bouwjaar', type: FeatureAttributeTypeEnum.INTEGER },
    { key: 'status', alias: 'Status', type: FeatureAttributeTypeEnum.STRING },
  ];
  return {
    features: features.map(featureOverride => getFeatureModel({ ...featureOverride })),
    columnMetadata: columnMetadata.map(columnMetadataOverride => getColumnMetadataModel({ ...columnMetadataOverride })),
    page: null,
    pageSize: null,
    total: 8,
    ...overrides,
  };
};

export const getUniqueValuesResponseModel = (overrides?: Partial<UniqueValuesResponseModel>): UniqueValuesResponseModel => ({
  values: [ 'Pand in gebruik', 'Pand niet in gebruik' ],
  filterApplied: false,
  ...overrides,
});

export const getViewerResponseData = (overrides?: Partial<ViewerResponseModel>): ViewerResponseModel => ({
  id: 'app/default',
  kind: 'app',
  name: 'default',
  title: 'My viewer',
  baseViewers: [],
  languages: [Language.NL_NL],
  projections: ['EPSG:28992'],
  components: [],
  ...overrides,
});

export const getLayerExportCapabilitiesModel = (overrides?: Partial<LayerExportCapabilitiesModel>): LayerExportCapabilitiesModel => ({
  exportable: true,
  outputFormats: [ 'SHAPE-ZIP',  'excel2007',  'gpkg',  'json',  'text/csv' ],
  ...overrides,
});

export const getMapResponseData = (overrides?: Partial<MapResponseModel>): MapResponseModel => ({
  crs: getCrsModel(overrides?.crs),
  layerTreeNodes: [
    getLayerTreeNode({ childrenIds: ['level-2'] }),
    getLayerTreeNode({ id: 'level-2', name: 'Bestuurlijke Gebieden', childrenIds: [ 'applayer-2', 'applayer-3' ], root: false }),
    getLayerTreeNode({ id: 'applayer-2', appLayerId: '2', name: 'Gemeentegebied', root: false }),
    getLayerTreeNode({ id: 'applayer-3', appLayerId: '3', name: 'Provinciegebied', root: false }),
  ],
  baseLayerTreeNodes: [
    getLayerTreeNode({ id: 'rootbg', name: 'background', childrenIds: ['level-1'] }),
    getLayerTreeNode({ id: 'level-1', name: 'Openstreetmap', childrenIds: ['applayer-1'], root: false }),
    getLayerTreeNode({ id: 'applayer-1', appLayerId: '1', name: 'osm-nb-hq', root: false }),
  ],
  appLayers: [
    getAppLayerModel({ id: '1', layerName: 'osm-nb-hq', title: 'osm-nb-hq' }),
    getAppLayerModel({ id: '2', hasAttributes: true, serviceId: 'bestuurlijkegebieden', layerName: 'gemeentegebied', title: 'Gemeentegebied' }),
    getAppLayerModel({ id: '3', hasAttributes: true, serviceId: 'bestuurlijkegebieden', layerName: 'provinciegebied', title: 'Provinciegebied' }),
  ],
  initialExtent: overrides?.initialExtent === null ? null : getBoundsModel(overrides?.initialExtent),
  services: [
    getServiceModel({
      id: 'openbasiskaart',
      url: 'https://www.openbasiskaart.nl/mapcache/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
    }),
    getServiceModel({
      id: 'bestuurlijkegebieden',
      url: 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wms/v1_0?request=GetCapabilities&service=WMS',
    }),
  ],
  maxExtent: overrides?.maxExtent === null
    ? getBoundsModel({ minx: -285401, miny: 22598, maxx: 595401, maxy: 903401 })
    : getBoundsModel(overrides?.maxExtent),
  ...overrides,
});
