export class StyleHelper {

  public static getDashArray(strokeType?: 'solid' | 'dash' | 'dot', strokeWidth: number = 0): number[] {
    if (strokeType === 'dash') {
      return [ Math.max(0, strokeWidth) + 4, Math.max(6, strokeWidth) + 6 ];
    }
    if (strokeType === 'dot') {
      return [ 1, Math.max(4, strokeWidth) + 4 ];
    }
    return [];
  }

}
