import { register } from 'ol/proj/proj4';
import { Proj4Helper } from './proj4.helper';

export class ProjectionsHelper {

  public static initProjection(
    projection: string,
    definition: string,
    projectionAliases?: string[],
  ) {
    ProjectionsHelper.registerProjection(projection, definition);
    (projectionAliases || []).forEach(alias => {
      ProjectionsHelper.registerProjection(alias, definition);
    });
    register(Proj4Helper.proj4);
  }

  private static registerProjection(projection: string, definition: string) {
    if (!Proj4Helper.proj4.defs(projection) && !!definition) {
      if (projection === 'EPSG:28992') {
        // eslint-disable-next-line max-len
        definition = '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs';
      }
      Proj4Helper.proj4.defs(projection, definition);
    }
  }

}
