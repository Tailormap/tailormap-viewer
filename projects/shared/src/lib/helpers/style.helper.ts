export class StyleHelper {

  private static readonly STROKE_NUMBER_REGEX = /^(\d+(\s+\d+)*)$/;

  public static getDashArray(strokeType?: 'solid' | 'dash' | 'dot' | string | number[], strokeWidth = 0): number[] {
    if (strokeType === 'dash') {
      return [ Math.max(0, strokeWidth) + 4, Math.max(6, strokeWidth) + 6 ];
    }
    if (strokeType === 'dot') {
      return [ 1, Math.max(4, strokeWidth) + 4 ];
    }
    if (Array.isArray(strokeType)) {
      return strokeType;
    }
    return StyleHelper.getDashArrayFromString(strokeType || '');
  }

  public static getDashArrayFromString(strokeType: string): number[] {
    if (strokeType && StyleHelper.STROKE_NUMBER_REGEX.test(strokeType)) {
      return strokeType.split(' ').map((s) => {
        const num = parseFloat(s);
        return isNaN(num) ? 0 : Math.max(0, num);
      });
    }
    return [];
  }

}
