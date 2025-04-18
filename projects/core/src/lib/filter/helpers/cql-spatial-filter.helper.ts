import { SpatialFilterModel } from '@tailormap-viewer/api';

export class CqlSpatialFilterHelper {

  public static convertSpatialFilterToQuery(filter: SpatialFilterModel, layerId: string): string | null {
    if (filter.geometries.length === 0 || filter.geometryColumns.length === 0) {
      return null;
    }

    const { baseGeometries, circles } = this.categorizeGeometries(filter.geometries.map(g => g.geometry));
    const filterGeometries: string[] = [];
    if (baseGeometries.length > 0) {
      const baseGeom = baseGeometries.length === 1 ? baseGeometries[0] : 'GEOMETRYCOLLECTION(' + baseGeometries.join(',') + ')';
      filterGeometries.push(filter.buffer ? `BUFFER(${baseGeom}, ${filter.buffer})` : baseGeom);
    }
    if (circles.length > 0) {
      filterGeometries.push(...circles.map(circle => CqlSpatialFilterHelper.getCircleQuery(circle, filter.buffer)));
    }

    const geometryColumnsForLayer = filter.geometryColumns.find(gc => gc.layerId === layerId);
    if (!geometryColumnsForLayer) {
      return null;
    }

    const geometryColumnClauses = geometryColumnsForLayer.column.map(geometryColumn => {
      const intersectGeoms = filterGeometries
        .map(geomParam => `INTERSECTS(${geometryColumn}, ${geomParam})`)
        .filter(geomParam => !!geomParam);
      return intersectGeoms.length === 1
        ? intersectGeoms[0]
        : `(` + intersectGeoms.join(' OR ') + `)`;
    });
    return geometryColumnClauses.length === 1
      ? geometryColumnClauses[0]
      : `(` + geometryColumnClauses.join(' OR ') + `)`;
  }

  private static categorizeGeometries(geometries: string[]): { baseGeometries: string[]; circles: string[] } {
    const baseGeometries: string[] = [];
    const circles: string[] = [];

    geometries.forEach(geom => {
      if (CqlSpatialFilterHelper.isBaseGeometry(geom)) {
        baseGeometries.push(geom);
      } else if (CqlSpatialFilterHelper.isCircle(geom)) {
        circles.push(geom);
      }
    });

    return { baseGeometries, circles };
  }

  private static getCircleQuery(circle: string, buffer?: number): string {
    const geom = circle.substring(7, circle.length - 1);
    const [ x, y, radius ] = geom.split(/\s+/);
    const bufferedRadius = parseFloat(radius) + (buffer || 0);
    return `BUFFER(POINT(${x} ${y}), ${bufferedRadius})`;
  }

  private static isCircle(geom: string): boolean {
    return geom.startsWith('CIRCLE(');
  }

  private static isBaseGeometry(geom: string): boolean {
    return geom.startsWith('POLYGON')
      || geom.startsWith('LINESTRING')
      || geom.startsWith('POINT')
      || geom.startsWith('MULTIPOLYGON')
      || geom.startsWith('MULTILINESTRING')
      || geom.startsWith('MULTIPOINT');
  }

}
