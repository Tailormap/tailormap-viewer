type ValueType = any[] | string | number | boolean | undefined | null;

export class FormHelper {

  public static NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;

  public static isValidValue(value: string | undefined | null) {
    return typeof value !== 'undefined' && value !== null && value.length > 0;
  }

  public static someValuesChanged(param: Array<[ValueType, ValueType]>) {
    return param.some(([ value, original ]) => {
      return value !== original;
    });
  }

}
