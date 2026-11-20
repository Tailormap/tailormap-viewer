import { Circle } from 'ol/geom.js';
import { fromCircle } from 'ol/geom/Polygon.js';
import { WKT } from 'ol/format.js';
import { WKTReader, WKTWriter } from 'jsts/org/locationtech/jts/io.js';
import { BufferOp } from 'jsts/org/locationtech/jts/operation/buffer.js';
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js';

export class GeometryHelper {

  public static bufferWktGeometry(wktGeom: string, bufferDistance: number): string {
    const parsedGeom = new WKTReader().read(wktGeom);
    const bufferedGeom = BufferOp.bufferOp(parsedGeom, bufferDistance);
    return new WKTWriter().write(bufferedGeom);
  }

  /**
   *
   * @param circle in the internal format "CIRCLE(127845.9 459695.36 351.01)"
   * @param buffer distance
   */
  public static getCircleQueryWKT(circle: string, buffer?: number): string {
    const geom = circle.substring(7, circle.length - 1);
    const [ x, y, radius ] = geom.split(/\s+/);
    const bufferedRadius = parseFloat(radius) + (buffer || 0);
    const olCircle = new Circle([ parseFloat(x), parseFloat(y) ], bufferedRadius);
    const circlePolygon = fromCircle(olCircle);
    return new WKT().writeGeometry(circlePolygon);
  }

  /**
   * Builds a test that tells whether a WKT geometry intersects any of the given geometries.
   * The given geometries are parsed once, so the returned function is cheap to call for many features.
   * The extent of a tested geometry is checked before the exact intersection.
   * jsts prepared geometries are not used: in jsts 2.12 their constructors fail (PreparedPolygon calls super() without the geometry).
   * A tested geometry that cannot be parsed does not intersect.
   *
   * @param geometries WKT geometries to test against, all in the same projection as the tested geometries
   */
  public static intersects(geometries: string[]): (wkt: string) => boolean {
    const reader = new WKTReader();
    const parsed = geometries.map(geometry => reader.read(geometry));
    const extents = parsed.map(geometry => geometry.getEnvelopeInternal());
    return (wkt: string) => {
      let geometry;
      try {
        geometry = reader.read(wkt);
      } catch (_e) {
        return false;
      }
      const extent = geometry.getEnvelopeInternal();
      return parsed.some((filterGeometry, idx) => extents[idx].intersects(extent) && RelateOp.intersects(filterGeometry, geometry));
    };
  }
}
