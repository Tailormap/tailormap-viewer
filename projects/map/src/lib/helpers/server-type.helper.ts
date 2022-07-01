
export class ServerTypeHelper {
  public static getFromUrl(url: string): undefined | 'geoserver' | 'mapserver' {
    if (url.includes('/arcgis/')) {
      return undefined;
    }
    if (url.includes('/geoserver/')) {
      return 'geoserver';
    }
    if (url.includes('/mapserv')) { // /cgi-bin/mapserv, /cgi-bin/mapserv.cgi, /cgi-bin/mapserv.fcgi
      return 'mapserver';
    }
    return undefined;
  }
}
