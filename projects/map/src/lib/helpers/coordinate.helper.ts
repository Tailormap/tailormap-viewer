import { circular } from 'ol/geom/Polygon.js';
import { getTransform, get as getProjection } from 'ol/proj.js';
import { FeatureHelper } from './feature.helper';
import { Proj4Helper } from './proj4.helper';
import { ProjectionsHelper } from './projections.helper';

export class CoordinateHelper {
  public static projectCoordinates(coords: [number, number], fromProjection: string, toProjection: string): [number, number] {
    ProjectionsHelper.ensureProjection(fromProjection);
    ProjectionsHelper.ensureProjection(toProjection);
    return Proj4Helper.proj4(fromProjection, toProjection, coords);
  }

  /**
   * Calculates a WKT approximation of a circle on Earth using the WGS84 ellipsoid.
   *
   * @param coords       the coordinates (longitude, latitude) in degrees.
   * @param radius       the radius of the circle in meters.
   * @param toProjection the projection to use for WKT output.
   * @returns a WKT representation of the circle.
   */
  public static circleFromWGS84CoordinatesAndRadius(coords: number[], radius: number, toProjection: string): string {
      const polygon = circular(coords, radius, 128);
      const projection = getProjection(toProjection);
      if (projection === null) {
          return '';
      }
      const transformFn = getTransform('EPSG:4326', toProjection);
      if (transformFn === null) {
          return '';
      }
      polygon.applyTransform(transformFn);
      return FeatureHelper.getWKT(polygon, projection);
  }
}
