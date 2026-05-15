export class UnitsHelper {

  private static BUFFER_OPACITY_DECREASE = 20;

  public static getNumberValue(nr: number | undefined, defaultValue: number): number {
    if (typeof nr === 'undefined') {
      return defaultValue;
    }
    return nr;
  }

  public static getOpacity(opacity: number | undefined, hasBuffer?: boolean) {
    return Math.max(0, (opacity || 100) - (hasBuffer ? UnitsHelper.BUFFER_OPACITY_DECREASE : 0));
  }

  public static getRotationForDegrees(degrees?: number): number {
    if (!degrees) {
      return degrees || 0;
    }
    return degrees / (180 / Math.PI);
  }

}
