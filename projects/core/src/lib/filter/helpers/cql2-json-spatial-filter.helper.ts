import { SpatialFilterModel } from '@tailormap-viewer/api';
import { Cql2JsonFilter, Cql2JsonGeometry, Cql2JsonProperty, Cql2JsonSpatialFunction, Cql2JsonSpatialOp } from '../models/cql2-json-filter.model';

export class Cql2JsonSpatialFilterHelper {

  public static convertSpatialFilterToQuery(filter: SpatialFilterModel, layerId: string): Cql2JsonFilter | null {
    if (filter.geometries.length === 0 || filter.geometryColumns.length === 0) {
      return null;
    }

    const { baseGeometries, circles } = this.categorizeGeometries(filter.geometries.map(g => g.geometry));
    const filterGeometries: Array<Cql2JsonGeometry | Cql2JsonSpatialFunction> = [];

    if (baseGeometries.length > 0) {
      const geoJsonGeometry = baseGeometries.length === 1
        ? this.wktToGeoJson(baseGeometries[0])
        : this.createGeometryCollection(baseGeometries);

      if (geoJsonGeometry) {
        filterGeometries.push(
          filter.buffer
            ? { function: 'buffer', args: [ geoJsonGeometry, filter.buffer ] }
            : geoJsonGeometry,
        );
      }
    }

    if (circles.length > 0) {
      filterGeometries.push(...circles.map(circle => this.getCircleGeoJson(circle, filter.buffer)));
    }

    const geometryColumnsForLayer = filter.geometryColumns.find(gc => gc.layerId === layerId);
    if (!geometryColumnsForLayer) {
      return null;
    }

    const geometryColumnClauses: Cql2JsonSpatialOp[] = geometryColumnsForLayer.column.flatMap(geometryColumn => {
      const property: Cql2JsonProperty = { property: geometryColumn };
      return filterGeometries.map(geomParam => ({
        op: 's_intersects' as const,
        args: [ property, geomParam ] as [Cql2JsonProperty, Cql2JsonGeometry | Cql2JsonSpatialFunction],
      }));
    });

    if (geometryColumnClauses.length === 0) {
      return null;
    }
    if (geometryColumnClauses.length === 1) {
      return geometryColumnClauses[0];
    }
    return { op: 'or', args: geometryColumnClauses };
  }

  private static categorizeGeometries(geometries: string[]): { baseGeometries: string[]; circles: string[] } {
    const baseGeometries: string[] = [];
    const circles: string[] = [];

    geometries.forEach(geom => {
      if (this.isBaseGeometry(geom)) {
        baseGeometries.push(geom);
      } else if (this.isCircle(geom)) {
        circles.push(geom);
      }
    });

    return { baseGeometries, circles };
  }

  private static getCircleGeoJson(circle: string, additionalBuffer?: number): Cql2JsonSpatialFunction {
    const geom = circle.substring(7, circle.length - 1);
    const [ x, y, radius ] = geom.split(/\s+/);
    const bufferedRadius = parseFloat(radius) + (additionalBuffer || 0);
    const pointGeometry: Cql2JsonGeometry = {
      type: 'Point',
      coordinates: [ parseFloat(x), parseFloat(y) ],
    };
    return { function: 'buffer', args: [ pointGeometry, bufferedRadius ] };
  }

  private static wktToGeoJson(wkt: string): Cql2JsonGeometry | null {
    // Parse basic WKT geometries to GeoJSON
    const trimmedWkt = wkt.trim();

    if (trimmedWkt.startsWith('POINT')) {
      return this.parsePoint(trimmedWkt);
    }
    if (trimmedWkt.startsWith('LINESTRING')) {
      return this.parseLineString(trimmedWkt);
    }
    if (trimmedWkt.startsWith('POLYGON')) {
      return this.parsePolygon(trimmedWkt);
    }
    if (trimmedWkt.startsWith('MULTIPOINT')) {
      return this.parseMultiPoint(trimmedWkt);
    }
    if (trimmedWkt.startsWith('MULTILINESTRING')) {
      return this.parseMultiLineString(trimmedWkt);
    }
    if (trimmedWkt.startsWith('MULTIPOLYGON')) {
      return this.parseMultiPolygon(trimmedWkt);
    }

    return null;
  }

  private static parsePoint(wkt: string): Cql2JsonGeometry {
    const coords = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')')).trim();
    const [ x, y ] = coords.split(/\s+/).map(parseFloat);
    return { type: 'Point', coordinates: [ x, y ] };
  }

  private static parseLineString(wkt: string): Cql2JsonGeometry {
    const coords = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')')).trim();
    const coordinates = coords.split(',').map(coord => {
      const [ x, y ] = coord.trim().split(/\s+/).map(parseFloat);
      return [ x, y ];
    });
    return { type: 'LineString', coordinates };
  }

  private static parsePolygon(wkt: string): Cql2JsonGeometry {
    // Extract content between outer parentheses
    const content = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')'));
    // Split by rings (each ring is wrapped in parentheses)
    const rings = this.extractRings(content);
    const coordinates = rings.map(ring => {
      return ring.split(',').map(coord => {
        const [ x, y ] = coord.trim().split(/\s+/).map(parseFloat);
        return [ x, y ];
      });
    });
    return { type: 'Polygon', coordinates };
  }

  private static parseMultiPoint(wkt: string): Cql2JsonGeometry {
    const content = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')')).trim();
    const coordinates = content.split(',').map(coord => {
      const cleaned = coord.trim().replace(/[()]/g, '');
      const [ x, y ] = cleaned.split(/\s+/).map(parseFloat);
      return [ x, y ];
    });
    return { type: 'MultiPoint', coordinates };
  }

  private static parseMultiLineString(wkt: string): Cql2JsonGeometry {
    const content = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')'));
    const lineStrings = this.extractRings(content);
    const coordinates = lineStrings.map(line => {
      return line.split(',').map(coord => {
        const [ x, y ] = coord.trim().split(/\s+/).map(parseFloat);
        return [ x, y ];
      });
    });
    return { type: 'MultiLineString', coordinates };
  }

  private static parseMultiPolygon(wkt: string): Cql2JsonGeometry {
    const content = wkt.substring(wkt.indexOf('(') + 1, wkt.lastIndexOf(')'));
    // Extract each polygon (wrapped in double parentheses)
    const polygons = this.extractPolygons(content);
    const coordinates = polygons.map(polygon => {
      const rings = this.extractRings(polygon);
      return rings.map(ring => {
        return ring.split(',').map(coord => {
          const [ x, y ] = coord.trim().split(/\s+/).map(parseFloat);
          return [ x, y ];
        });
      });
    });
    return { type: 'MultiPolygon', coordinates };
  }

  private static extractRings(content: string): string[] {
    const rings: string[] = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '(') {
        if (depth === 0) {
          start = i + 1;
        }
        depth++;
      } else if (content[i] === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          rings.push(content.substring(start, i));
          start = -1;
        }
      }
    }

    return rings;
  }

  private static extractPolygons(content: string): string[] {
    const polygons: string[] = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '(') {
        if (depth === 0) {
          start = i + 1;
        }
        depth++;
      } else if (content[i] === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          polygons.push(content.substring(start, i));
          start = -1;
        }
      }
    }

    return polygons;
  }

  private static createGeometryCollection(geometries: string[]): Cql2JsonGeometry | null {
    const geoJsonGeometries = geometries.map(g => this.wktToGeoJson(g)).filter(g => g !== null);
    if (geoJsonGeometries.length === 0) {
      return null;
    }
    return {
      type: 'GeometryCollection',
      coordinates: geoJsonGeometries,
    };
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
