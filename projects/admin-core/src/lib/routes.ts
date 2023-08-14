export enum RoutesEnum {
  ADMIN_HOME = '',
  LOGIN = 'login',
  CATALOG = 'catalog',
  CATALOG_NODE_DETAILS = 'node/:nodeId',
  CATALOG_SERVICE_DETAILS = 'node/:nodeId/service/:serviceId',
  CATALOG_LAYER_DETAILS = 'node/:nodeId/service/:serviceId/layer/:layerId',
  FEATURE_SOURCE_DETAILS = 'node/:nodeId/feature-source/:featureSourceId',
  FEATURE_TYPE_DETAILS = 'node/:nodeId/feature-source/:featureSourceId/feature-type/:featureTypeId',
  USER = 'users',
  USER_CREATE = 'create',
  USER_DETAILS = 'user/:userName',
  GROUP = 'groups',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  GROUP_CREATE = 'create',
  GROUP_DETAILS = 'group/:groupName',
  APPLICATION = 'applications',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  APPLICATION_CREATE = 'create',
  APPLICATION_DETAILS = 'application/:applicationId',
  APPLICATION_DETAILS_LAYERS = 'layers',
  APPLICATION_DETAILS_BASE_LAYERS = 'base-layers',
  APPLICATION_DETAILS_COMPONENTS = 'components',
  APPLICATION_DETAILS_STYLING = 'styling',

  OIDC_CONFIGURATION = 'oidc-configurations',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  OIDC_CONFIGURATION_CREATE = 'create',
  OIDC_CONFIGURATION_DETAILS = 'oidc-configuration/:oidcConfigurationId',
}
