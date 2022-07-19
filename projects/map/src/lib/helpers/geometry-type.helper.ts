import { Circle, Geometry, LineString, Point, Polygon } from 'ol/geom';

export class GeometryTypeHelper {

  public static isKnownGeometry(geometry?: Geometry): geometry is Point | LineString | Polygon | Circle {
    return GeometryTypeHelper.isLineGeometry(geometry)
    || GeometryTypeHelper.isPolygonGeometry(geometry)
    || GeometryTypeHelper.isPointGeometry(geometry)
    || GeometryTypeHelper.isCircleGeometry(geometry);
  }

  public static isPointGeometry(geometry?: Geometry): geometry is Point {
    return geometry?.getType() === 'Point';
  }

  public static isLineGeometry(geometry?: Geometry): geometry is LineString {
    return geometry?.getType() === 'LineString';
  }

  public static isPolygonGeometry(geometry?: Geometry): geometry is Polygon {
    return geometry?.getType() === 'Polygon';
  }

  public static isCircleGeometry(geometry?: Geometry): geometry is Circle {
    return geometry?.getType() === 'Circle';
  }

}
