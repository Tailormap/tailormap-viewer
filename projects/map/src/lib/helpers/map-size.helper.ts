import { MapUnitEnum } from '../models/map-unit.enum';
import { Geometry } from 'ol/geom';
import { GeometryTypeHelper } from './geometry-type.helper';
import { getLength as getSphereLength, getArea as getSphereArea, offset as sphereOffset } from 'ol/sphere';
import { ProjectionsHelper } from './projections.helper';
import { fromLonLat, toLonLat } from 'ol/proj';

export class MapSizeHelper {

  public static getSize(geometry?: Geometry, projection?: string) {
    if (projection && ProjectionsHelper.needsSphericalMeasurements(projection)) {
      return MapSizeHelper.getSphericalSize(geometry, projection);
    }
    if (GeometryTypeHelper.isLineGeometry(geometry)) {
      return geometry.getLength();
    }
    if (GeometryTypeHelper.isPolygonGeometry(geometry)) {
      return geometry.getArea();
    }
    if (GeometryTypeHelper.isCircleGeometry(geometry)) {
      return Math.PI * Math.pow(geometry.getRadius(), 2);
    }
    return 0;
  }

  public static getSphericalSize(geometry?: Geometry, projection?: string) {
    if (GeometryTypeHelper.isLineGeometry(geometry)) {
      return getSphereLength(geometry, { projection: projection ?? 'EPSG:3857' });
    }
    if (GeometryTypeHelper.isPolygonGeometry(geometry) || GeometryTypeHelper.isCircleGeometry(geometry)) {
      return getSphereArea(geometry, { projection: projection ?? 'EPSG:3857' });
    }
    return 0;
  }

  public static getFormattedSize(geometry?: Geometry, projection?: string) {
    const size = MapSizeHelper.getSize(geometry, projection);
    if (size && GeometryTypeHelper.isLineGeometry(geometry)) {
      return MapSizeHelper.getFormattedLength(size);
    }
    if (size && GeometryTypeHelper.isPolygonGeometry(geometry) || GeometryTypeHelper.isCircleGeometry(geometry)) {
      return MapSizeHelper.getFormattedArea(size);
    }
    return '';
  }

  public static getFormattedLength(size?: number): string {
    if (!size) {
      return '';
    }
    if (size > 1000) {
      return (Math.round(size / 1000 * 100) / 100) + ' ' + 'km';
    } else {
      return (Math.round(size * 100) / 100) + ' ' + 'm';
    }
  }

  public static getFormattedArea(size?: number): string {
    if (!size) {
      return '';
    }
    if (size > 100000) {
      return (Math.round(size / 1000000 * 100) / 100) + ' ' + 'km\xB2';
    } else {
      return (Math.round(size * 100) / 100) + ' ' + 'm\xB2';
    }
  }

  public static getCoordinatePrecision(uom: MapUnitEnum) {
    switch (uom) {
      case MapUnitEnum.m: return 2;
      case MapUnitEnum.ft: return 3;
      case MapUnitEnum['us-ft']: return 3;
      case MapUnitEnum.degrees: return 6;
      default: return 4;
    }
  }

  /**
  Translate a distance in meters to a distance in the projected units at a given point using Openlayers Sphere.
  For example, translating the distance in web mercator meters to the estimated number of meters at a given point.
  @param pointCoordinates The point coordinates in map projection units
  @param meters The desired distance in meters
  @param projection The map projection code, e.g. 'EPSG:3857'
   */
  public static metersToProjectedUnitsAtPoint(pointCoordinates: number[], meters: number, projection: string): number {
    const centerLonLat = toLonLat(pointCoordinates, projection);
    const offsetPointLonLat = sphereOffset(centerLonLat, meters, Math.PI / 2);
    const offsetPointProjected = fromLonLat(offsetPointLonLat, projection);
    return Math.sqrt(
      Math.pow(offsetPointProjected[0] - pointCoordinates[0], 2) +
      Math.pow(offsetPointProjected[1] - pointCoordinates[1], 2),
    );
  }

}
