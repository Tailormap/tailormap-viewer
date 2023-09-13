import { MapUnitEnum } from '../models/map-unit.enum';
import { Geometry } from 'ol/geom';
import { GeometryTypeHelper } from './geometry-type.helper';
import { getArea, getLength } from 'ol/sphere';
import { fromCircle } from 'ol/geom/Polygon';

export class MapSizeHelper {

  public static getSize(geometry?: Geometry) {
    if (GeometryTypeHelper.isLineGeometry(geometry)) {
      return getLength(geometry);
    }
    if (GeometryTypeHelper.isPolygonGeometry(geometry)) {
      return getArea(geometry);
    }
    if (GeometryTypeHelper.isCircleGeometry(geometry)) {
      return getArea(fromCircle(geometry));
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
    if (size > 100) {
      return (Math.round(size / 1000 * 100) / 100) + ' ' + 'km';
    } else {
      return (Math.round(size * 100) / 100) + ' ' + 'm';
    }
  }

  public static getFormattedArea(size?: number): string {
    if (!size) {
      return '';
    }
    if (size > 10000) {
      return (Math.round(size / 1000000 * 100) / 100) + ' ' + 'km';
    } else {
      return (Math.round(size * 100) / 100) + ' ' + 'm';
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
