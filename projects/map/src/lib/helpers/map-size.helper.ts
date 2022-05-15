import { MapUnitEnum } from '../models/map-unit.enum';

export class MapSizeHelper {

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
