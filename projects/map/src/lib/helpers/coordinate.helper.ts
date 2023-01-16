import proj4 from 'proj4';
import { circular } from 'ol/geom/Polygon';
import { getTransform, get as getProjection } from 'ol/proj';
import { FeatureHelper } from './feature.helper';

export class CoordinateHelper {
  public static projectCoordinates(coords: number[], fromProjection: string, toProjection: string): number[] {
    return proj4(fromProjection, toProjection, coords);
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

      polygon.applyTransform(getTransform('EPSG:4326', toProjection));
      return FeatureHelper.getWKT(polygon, projection);
  }
}
