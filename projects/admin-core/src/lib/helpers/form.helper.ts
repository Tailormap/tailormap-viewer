export class FormHelper {

  public static isValidValue(value: string | undefined | null) {
    return typeof value !== 'undefined' && value !== null && value.length > 0;
  }

  public static someValuesChanged(param: Array<[ string | boolean | undefined | null, string | boolean | undefined | null ]>) {
    return param.some(([ value, original ]) => {
      return value !== original;
    });
  }

}
