import { SpatialFilterModel } from '@tailormap-viewer/api';
import { GeometryHelper } from '@tailormap-viewer/map';

export class CqlSpatialFilterHelper {

  public static convertSpatialFilterToQuery(filter: SpatialFilterModel, layerId: string): string | null {
    if (filter.geometries.length === 0 || filter.geometryColumns.length === 0) {
      return null;
    }
    const srid = filter.projectionCode?.startsWith('EPSG:') ? Number.parseInt(filter.projectionCode.slice('EPSG:'.length), 10) : Number.NaN;
    const sridPrefix = Number.isFinite(srid) ? `SRID=${srid};` : '';

    const filterGeometries = CqlSpatialFilterHelper.getFilterGeometries(filter).map(geometry => `${sridPrefix}${geometry}`);

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

  /**
   * Returns the WKT geometries a spatial filter tests against: the base geometries (as one geometry collection when
   * there are several) with the buffer applied, and each circle as a polygon with the buffer added to its radius.
   * Shared by the CQL output and the feature predicate so both use the same geometries.
   */
  public static getFilterGeometries(filter: SpatialFilterModel): string[] {
    const { baseGeometries, circles } = this.categorizeGeometries(filter.geometries.map(g => g.geometry));
    const filterGeometries: string[] = [];
    if (baseGeometries.length > 0) {
      const baseGeom = baseGeometries.length === 1 ?
        `${baseGeometries[0]}` :
        `GEOMETRYCOLLECTION(` + baseGeometries.map(geom => `${geom}`).join(',') + ')';
      filterGeometries.push(filter.buffer ? GeometryHelper.bufferWktGeometry(baseGeom, filter.buffer) : baseGeom);
    }
    if (circles.length > 0) {
      filterGeometries.push(...circles.map(circle => GeometryHelper.getCircleQueryWKT(circle, filter.buffer)));
    }
    return filterGeometries;
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
