import { register } from 'ol/proj/proj4.js';
import { Proj4Helper } from './proj4.helper';

export class ProjectionsHelper {

  private static readonly KNOWN_PROJECTION_DEFINITIONS = new Map<string, string>([
    [ 'EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs' ],
    [ 'EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +type=crs' ],
    // eslint-disable-next-line max-len
    [ 'EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs' ],
  ]);

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

  public static ensureProjection(projection: string) {
    const definition = ProjectionsHelper.KNOWN_PROJECTION_DEFINITIONS.get(projection);
    if (!definition) {
      return;
    }
    ProjectionsHelper.registerProjection(projection, definition);
  }

  private static registerProjection(projection: string, definition: string) {
    if (!Proj4Helper.proj4.defs(projection) && !!definition) {
      if (projection === 'EPSG:28992') {
        definition = ProjectionsHelper.KNOWN_PROJECTION_DEFINITIONS.get('EPSG:28992') || definition;
      }
      Proj4Helper.proj4.defs(projection, definition);
    }
  }

  public static needsSphericalMeasurements(projection: string) {
    const def = Proj4Helper.proj4.defs(projection);
    if (!def) {
      return false;
    }
    return (def.sphere || def.projName === 'longlat' || def.projName === 'merc');
  }

}
