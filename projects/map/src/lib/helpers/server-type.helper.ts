import { ResolvedServerType, ServerType, ServiceModel } from '@tailormap-viewer/api';

export class ServerTypeHelper {
  public static getFromUrl(url: string): ResolvedServerType {
    if (!url) {
      // In case of a proxied service the server type must be explicitly set to use vendor-specific features
      return ResolvedServerType.GENERIC;
    }
    if (url.includes('/arcgis/')) {
      return ResolvedServerType.GENERIC;
    }
    if (url.includes('/geoserver/')) {
      return ResolvedServerType.GEOSERVER;
    }
    if (url.includes('/mapserv')) { // /cgi-bin/mapserv, /cgi-bin/mapserv.cgi, /cgi-bin/mapserv.fcgi
      return ResolvedServerType.MAPSERVER;
    }
    return ResolvedServerType.GENERIC;
  }

  public static resolveAutoServerType(service: ServiceModel): ResolvedServerType {
    if (!service) {
      return ResolvedServerType.GENERIC;
    }
    if (service.serverType === ServerType.MAPSERVER) {
      return ResolvedServerType.MAPSERVER;
    }
    if (service.serverType === ServerType.GEOSERVER) {
      return ResolvedServerType.GEOSERVER;
    }
    if (service.serverType === ServerType.AUTO) {
      return this.getFromUrl(service.url);
    }
    return ResolvedServerType.GENERIC;
  }
}
