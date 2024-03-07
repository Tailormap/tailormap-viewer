import { BoundsModel } from '@tailormap-viewer/api';

type ValueType = any[] | string | number | boolean | undefined | null;

export type ComparableValuesArray = Array<[ValueType, ValueType]>;

export class FormHelper {

  public static NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;

  public static isValidValue(value: string | undefined | null) {
    return typeof value !== 'undefined' && value !== null && value.length > 0;
  }

  public static getComparableValueBounds(param?: BoundsModel | null) {
    return param ? [ param.crs, param.minx, param.maxx, param.miny, param.maxy ].join('') : null;
  }

  public static someValuesChanged(param: Array<[ValueType, ValueType]>) {
    return param.some(([ value, original ]) => {
      return value !== original;
    });
  }

}
