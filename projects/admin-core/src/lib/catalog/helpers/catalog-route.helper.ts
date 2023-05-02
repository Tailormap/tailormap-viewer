import { RoutesEnum } from '../../routes';

export class CatalogRouteHelper {

  public static getCatalogNodeUrl(node: { id: string }): string {
    return CatalogRouteHelper.getUrl(RoutesEnum.CATALOG_NODE_DETAILS, [
      [ ':nodeId', node.id ],
    ]);
  }

  public static getGeoServiceUrl(geoService: { id: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(RoutesEnum.CATALOG_SERVICE_DETAILS, [
      [ ':nodeId', geoService.catalogNodeId ],
      [ ':serviceId', geoService.id ],
    ]);
  }

  public static getGeoServiceLayerUrl(layer: { id: string; serviceId: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(RoutesEnum.CATALOG_LAYER_DETAILS, [
      [ ':nodeId', layer.catalogNodeId ],
      [ ':serviceId', layer.serviceId ],
      [ ':layerId', layer.id ],
    ]);
  }

  public static getFeatureSourceUrl(featureSource: { id: string; catalogNodeId: string }): string {
    return CatalogRouteHelper.getUrl(RoutesEnum.FEATURE_SOURCE_DETAILS, [
      [ ':nodeId', featureSource.catalogNodeId ],
      [ ':featureSourceId', featureSource.id ],
    ]);
  }

  public static getFeatureTypeUrl(featureType: { id: string; catalogNodeId: string; featureSourceId: string }): string {
    return CatalogRouteHelper.getUrl(RoutesEnum.FEATURE_TYPE_DETAILS, [
      [ ':nodeId', featureType.catalogNodeId ],
      [ ':featureSourceId', featureType.featureSourceId ],
      [ ':featureTypeId', featureType.id ],
    ]);
  }

  private static getUrl(baseUrl: string, replacements: Array<[string, string]>) {
    const nodeUrl = replacements.reduce<string>((url, [ key, replacement ]) => url.replace(key, replacement), baseUrl);
    return [ '', RoutesEnum.CATALOG, nodeUrl ].join('/');
  }

}
