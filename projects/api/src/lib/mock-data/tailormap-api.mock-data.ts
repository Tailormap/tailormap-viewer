import {
  AppLayerModel, AppResponseModel, BoundsModel, ComponentModel, CoordinateReferenceSystemModel, GeometryType, Language, LayerDetailsModel,
  MapResponseModel, ServiceModel, ServiceProtocol,
} from '../models';
import { FeatureModel } from '../models/feature.model';
import { ColumnMetadataModel } from '../models/column-metadata.model';
import { FeatureAttributeTypeEnum } from '../models/feature-attribute-type.enum';
import { FeaturesResponseModel } from '../models/features-response.model';
import { of } from 'rxjs';
import { TailormapApiV1ServiceModel } from '../services';

export const getBoundsModel = (overrides?: Partial<BoundsModel>): BoundsModel => ({
  miny: 646.36,
  minx: 308975.28,
  maxy: 276050.82,
  maxx: 636456.31,
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

export const getAppLayerModel = (overrides?: Partial<AppLayerModel>): AppLayerModel => ({
  id: 1,
  url: 'https://test.nl',
  serviceId: 1,
  visible: true,
  crs: getCrsModel(overrides?.crs),
  isBaseLayer: false,
  displayName: 'Test',
  ...overrides,
});

export const getServiceModel = (overrides?: Partial<ServiceModel>): ServiceModel => ({
  id: 1,
  name: 'myservice',
  url: 'https://test.nl',
  useProxy: false,
  styleLibraries: {},
  protocol: ServiceProtocol.WMS,
  ...overrides,
});

export const getLayerDetailsModel = (overrides?: Partial<LayerDetailsModel>): LayerDetailsModel => ({
  id: 1,
  attributes: [],
  serviceId: 1,
  editable: true,
  featuretypeName: 'table',
  metadata: null,
  geometryAttribute: 'geom',
  geometryAttributeIndex: 5,
  geometryType: GeometryType.GEOMETRY,
  relations: [],
  ...overrides,
});

export const getComponentModel = (overrides?: Partial<ComponentModel>): ComponentModel => ({
  config: {
    label: 'label',
    title: 'title',
    tooltip: 'tooltip',
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

export const getFeaturesResponseModel = (overrides?: Partial<FeaturesResponseModel>): FeaturesResponseModel => ({
  features: ['1', '2', '3', '4', '5'].map(id => getFeatureModel({ __fid: id })),
  columnMetadata: [ getColumnMetadataModel(), getColumnMetadataModel({ key: 'prop2', alias: 'Property 2' }) ],
  ...overrides,
});

export const getAppResponseData = (overrides?: Partial<AppResponseModel>): AppResponseModel => ({
  id: 1,
  apiVersion: 'v1',
  name: 'viewer',
  title: 'My viewer',
  lang: Language.NL_NL,
  ...overrides,
});

export const getMapResponseData = (overrides?: Partial<MapResponseModel>): MapResponseModel => ({
  crs: getCrsModel(overrides?.crs),
  baseLayers: [
    getAppLayerModel({ id: 1, isBaseLayer: true }),
    getAppLayerModel({ id: 2, isBaseLayer: true }),
    getAppLayerModel({ id: 3, isBaseLayer: true }),
  ],
  initialExtent: overrides?.initialExtent === null ? null : getBoundsModel(overrides?.initialExtent),
  services: [
    getServiceModel(),
  ],
  maxExtent: overrides?.maxExtent === null ? null : getBoundsModel(overrides?.maxExtent),
  ...overrides,
});

export const getMockApiService = (
  overrides?: Partial<TailormapApiV1ServiceModel>,
): TailormapApiV1ServiceModel => ({
  getVersion$: () => of({ version: '0.1-SNAPSHOT', databaseversion: '47', apiVersion: 'v1' }),
  getApplication$: (params: { name?: string; version?: string; id?: number }) => of(getAppResponseData(params)),
  getMap$: () => of(getMapResponseData()),
  getLayers$: () => of([getAppLayerModel({id: 1}), getAppLayerModel({id: 2})]),
  getComponents$: () => of([getComponentModel()]),
  getDescribeLayer$: () => of(getLayerDetailsModel()),
  getFeatures$: () => of(getFeaturesResponseModel()),
  ...overrides,
});
