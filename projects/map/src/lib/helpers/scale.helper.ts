export class ScaleHelper {
  public static isInScale(scale?: number, minScale?: number, maxScale?: number): boolean {
    if (typeof scale === 'undefined' || scale === null) {
      return true;
    }
    const aboveMin = typeof minScale === 'undefined' || minScale === null ? true : scale > minScale;
    const belowMax = typeof maxScale === 'undefined' || maxScale === null ? true : scale < maxScale;
    return aboveMin && belowMax;
  }
}
