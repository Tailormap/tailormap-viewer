import { AppLayerWithServiceModel, ServiceHiDpiMode } from '@tailormap-viewer/api';

export class ServerTypeHelper {
  public static getFromUrl(url: string): ServiceHiDpiMode.GEOSERVER | ServiceHiDpiMode.MAPSERVER | undefined {
    if (url.includes('/arcgis/')) {
      return undefined;
    }
    if (url.includes('/geoserver/')) {
      return ServiceHiDpiMode.GEOSERVER;
    }
    if (url.includes('/mapserv')) { // /cgi-bin/mapserv, /cgi-bin/mapserv.cgi, /cgi-bin/mapserv.fcgi
      return ServiceHiDpiMode.MAPSERVER;
    }
    return undefined;
  }

  public static resolveAutoServerType(layer: AppLayerWithServiceModel): ServiceHiDpiMode.GEOSERVER | ServiceHiDpiMode.MAPSERVER | undefined {
    if (!layer.service) {
      return undefined;
    }
    if (layer.service.hiDpiMode === ServiceHiDpiMode.MAPSERVER || layer.service.hiDpiMode === ServiceHiDpiMode.GEOSERVER) {
      return layer.service.hiDpiMode;
    }
    if (layer.service.hiDpiMode === ServiceHiDpiMode.AUTO) {
      return this.getFromUrl(layer.service.url);
    }
    return undefined;
  }

  public static isGeoServer(layer: AppLayerWithServiceModel): boolean {
    if (!layer.service) {
      return false;
    }
    return this.resolveAutoServerType(layer) === ServiceHiDpiMode.GEOSERVER;
  }
}
