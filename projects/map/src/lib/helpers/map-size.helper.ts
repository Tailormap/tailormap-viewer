import { MapUnitEnum } from '../models/map-unit.enum';
import { Geometry } from 'ol/geom';
import { GeometryTypeHelper } from './geometry-type.helper';

export class MapSizeHelper {

  public static getSize(geometry?: Geometry) {
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

  public static getFormattedSize(geometry?: Geometry) {
    const size = MapSizeHelper.getSize(geometry);
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

}
