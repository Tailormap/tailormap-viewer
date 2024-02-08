import { Routes } from '../../routes';

export class CatalogRouteHelper {

  public static getCatalogNodeUrl(node: { id: string }): string {
    return CatalogRouteHelper.getUrl(Routes.CATALOG_NODE_DETAILS, [
      [ ':nodeId', node.id ],
    ]);
  }

  public static getGeoServiceUrl(geoService: { id: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(Routes.CATALOG_SERVICE_DETAILS, [
      [ ':serviceId', geoService.id ],
    ]);
  }

  public static getGeoServiceLayerUrl(layer: { id: string; serviceId: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(Routes.CATALOG_LAYER_DETAILS, [
      [ ':layerId', layer.id ],
    ]);
  }

  public static getFeatureSourceUrl(featureSource: { id: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(Routes.FEATURE_SOURCE_DETAILS, [
      [ ':featureSourceId', featureSource.id ],
    ]);
  }

  public static getFeatureTypeUrl(featureType: { id: string; catalogNodeId: string; featureSourceId: string }): string {
    return CatalogRouteHelper.getUrl(Routes.FEATURE_TYPE_DETAILS, [
      [ ':featureTypeId', featureType.id ],
    ]);
  }

  private static getUrl(baseUrl: string, replacements: Array<[string, string]>) {
    const nodeUrl = replacements.reduce<string>((url, [ key, replacement ]) => url.replace(key, replacement), baseUrl);
    return [ '/admin', Routes.CATALOG, nodeUrl ].join('/');
  }

}
