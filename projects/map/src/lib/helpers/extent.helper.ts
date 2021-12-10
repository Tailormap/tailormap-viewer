import { OpenlayersExtent } from '../models/extent.type';

const rdExtent: OpenlayersExtent = [-285401.0, 22598.0, 595401.0, 903401.0];
const wgs84Extent: OpenlayersExtent = [ -180, -90, 180, 90 ];

export class ExtentHelper {

  public static getRdExtent(): OpenlayersExtent {
    return rdExtent;
  }

  public static getWgs84Extent(): OpenlayersExtent {
    return wgs84Extent;
  }

  public static isValidX(x?: number) {
    return x !== undefined && x > rdExtent[0] && x < rdExtent[2];
  }

  public static isValidY(y?: number) {
    return y !== undefined && y > rdExtent[1] && y < rdExtent[3];
  }

}
