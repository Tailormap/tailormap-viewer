export class FormHelper {

  public static isValidValue(value: string | undefined | null) {
    return typeof value !== 'undefined' && value !== null && value.length > 0;
  }

  public static someValuesChanged(param: Array<[ string | undefined | null, string | undefined ]>) {
    return param.some(([ value, original ]) => {
      return !!value && value !== original;
    });
  }

}
