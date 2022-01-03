import {
  AppLayerModel, AppResponseModel, BoundsModel, CoordinateReferenceSystemModel, Language, MapResponseModel, ServiceModel, ServiceProtocol,
} from '@tailormap-viewer/api';

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
  displayName: 'test',
  serviceId: 1,
  visible: true,
  crs: getCrsModel(overrides?.crs),
  isBaseLayer: false,
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
