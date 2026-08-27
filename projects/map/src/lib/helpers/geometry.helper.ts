import { Circle } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { WKT } from 'ol/format';
import { WKTReader, WKTWriter } from 'jsts/org/locationtech/jts/io';
import { BufferOp } from 'jsts/org/locationtech/jts/operation/buffer';

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
}
