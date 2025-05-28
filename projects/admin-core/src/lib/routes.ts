export class Routes {
  public static ADMIN_HOME = '';
  public static LOGIN = 'login';

  public static CATALOG = 'catalog';
  public static CATALOG_NODE_DETAILS = 'node/:nodeId';
  public static CATALOG_SERVICE_DETAILS = 'service/:serviceId';
  public static CATALOG_LAYER_DETAILS = 'layer/:layerId';
  public static FEATURE_SOURCE_DETAILS = 'feature-source/:featureSourceId';
  public static FEATURE_TYPE_DETAILS = 'feature-type/:featureTypeId';

  public static USER = 'users';
  public static USER_CREATE = 'create';
  public static USER_DETAILS = 'user/:userName';

  public static GROUP = 'groups';
  public static GROUP_CREATE = 'create';
  public static GROUP_DETAILS = 'group/:groupName';

  public static APPLICATION = 'applications';
  public static APPLICATION_CREATE = 'create';
  public static APPLICATION_DETAILS = 'application/:applicationId';
  public static APPLICATION_DETAILS_LAYERS = 'layers';
  public static APPLICATION_DETAILS_BASE_LAYERS = 'base-layers';
  public static APPLICATION_DETAILS_TERRAIN_LAYERS = 'terrain-layers';
  public static APPLICATION_DETAILS_COMPONENTS = 'components';
  public static APPLICATION_DETAILS_STYLING = 'styling';
  public static APPLICATION_DETAILS_FILTERS = 'filters';
  public static APPLICATION_DETAILS_FILTERS_CREATE = 'create';
  public static APPLICATION_DETAILS_FILTERS_EDIT = 'filter/:filterId';

  public static FORMS = 'forms';
  public static FORMS_CREATE = 'create';
  public static FORMS_DETAILS = 'form/:formId';

  public static SEARCH_INDEXES = 'search-indexes';
  public static SEARCH_INDEXES_CREATE = 'create';
  public static SEARCH_INDEXES_DETAILS = 'search-index/:searchIndexId';

  public static TASKS = 'tasks';
  public static TASK_DETAILS = 'task/:taskId';

  public static SETTINGS = 'settings';

  public static LOGS = 'logs';

  public static OIDC_CONFIGURATION = 'oidc-configurations';
  public static OIDC_CONFIGURATION_CREATE = 'create';
  public static OIDC_CONFIGURATION_DETAILS = 'oidc-configuration/:oidcConfigurationId';
}
