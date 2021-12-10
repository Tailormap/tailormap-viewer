import * as olExtent from 'ol/extent';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { OpenlayersExtent } from '../models/extent.type';
import { ExtentHelper } from './extent.helper';

export class ProjectionsHelper {

  public static initRD() {
    // eslint-disable-next-line max-len
    proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
    proj4.defs('http://www.opengis.net/gml/srs/epsg.xml#28992', proj4.defs('EPSG:28992'));
    register(proj4);
  }

  public static getResolutions(projection: string, extent: OpenlayersExtent): number[] {
    const size: number = projection === 'EPSG:3857' ? 20 : 22;
    const startResolution: number = olExtent.getWidth(extent) / 256;
    const resolutions: number[] = new Array(size);
    for (let i = 0, ii = resolutions.length; i < ii; ++i) {
      resolutions[i] = startResolution / Math.pow(2, i);
    }
    return resolutions;
  }

  public static getRdProjection() {
    return 'EPSG:28992';
  }

  public static getWGS84Projection() {
    return 'EPSG:4326';
  }

  public static getWebMercatorProjection() {
    return 'EPSG:3857';
  }

  public static WGS84ToRD(lat: number, lon: number) {
    return proj4(ProjectionsHelper.getWGS84Projection(), ProjectionsHelper.getRdProjection(), [lon, lat]);
  }

  public static RDtoWSG84(lat: number, lon: number): number[] {
    return proj4(ProjectionsHelper.getRdProjection(), ProjectionsHelper.getWGS84Projection(), [lon, lat]);
  }

  public static isWGS84Extent(extent: OpenlayersExtent): boolean {
    return olExtent.containsExtent(ExtentHelper.getWgs84Extent(), extent);
  }

}

ProjectionsHelper.initRD();
