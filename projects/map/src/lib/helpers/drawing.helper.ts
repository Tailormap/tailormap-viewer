import { createBox, createRegularPolygon, SketchCoordType } from 'ol/interaction/Draw';
import { Circle, Polygon, SimpleGeometry } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

export class DrawingHelper {

  public static squareGeometryFunction = createRegularPolygon(4);

  public static rectangleGeometryFunction = createBox();

  public static starGeometryFunction = (coordinates: SketchCoordType, geometry?: SimpleGeometry) => {
    const center = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (!DrawingHelper.isNumberArray(center) || !DrawingHelper.isNumberArray(last)) {
      return geometry || new Polygon([]);
    }
    const dx = center[0] - last[0];
    const dy = center[1] - last[1];
    const radius = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.atan2(dy, dx);
    const newCoordinates = [];
    const numPoints = 12;
    for (let i = 0; i < numPoints; ++i) {
      const angle = rotation + (i * 2 * Math.PI) / numPoints;
      const fraction = i % 2 === 0 ? 1 : 0.5;
      const offsetX = radius * fraction * Math.cos(angle);
      const offsetY = radius * fraction * Math.sin(angle);
      newCoordinates.push([ center[0] + offsetX, center[1] + offsetY ]);
    }
    newCoordinates.push(newCoordinates[0].slice());
    if (!geometry) {
      geometry = new Polygon([newCoordinates]);
    } else {
      geometry.setCoordinates([newCoordinates]);
    }
    return geometry;
  };

  public static ellipseGeometryFunction = (coordinates: SketchCoordType, geometry?: SimpleGeometry) => {
    const center = coordinates[0];
    const last = coordinates[1];
    if (!DrawingHelper.isNumberArray(center) || !DrawingHelper.isNumberArray(last)) {
      return geometry || new Polygon([]);
    }
    const dx = center[0] - last[0];
    const dy = center[1] - last[1];
    const radius = Math.sqrt(dx * dx + dy * dy);
    const circle = new Circle([ center[0], center[1] ], radius);
    const polygon = fromCircle(circle, 64);
    polygon.scale(dx/radius, dy/radius);
    if (!geometry) {
      geometry = polygon;
    } else {
      geometry.setCoordinates(polygon.getCoordinates());
    }
    return geometry;
  };

  private static isNumberArray(coordinate: number[] | number | Coordinate | Coordinate[]): coordinate is number[] {
    return Array.isArray(coordinate) && typeof coordinate[0] === 'number' && typeof coordinate[1] === 'number';
  }

}
