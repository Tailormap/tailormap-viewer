export enum RoutesEnum {
  CATALOG = 'page/catalog',
  CATALOG_NODE_DETAILS = 'node/:nodeId',
  CATALOG_SERVICE_DETAILS = 'node/:nodeId/service/:serviceId',
  CATALOG_LAYER_DETAILS = 'node/:nodeId/service/:serviceId/layer/:layerId',
  FEATURE_SOURCE_DETAILS = 'node/:nodeId/feature-source/:featureSourceId',
  ADMIN_HOME = '',
}
