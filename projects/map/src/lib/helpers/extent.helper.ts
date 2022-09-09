import { OpenlayersExtent } from '../models/extent.type';
import Geometry from 'ol/geom/Geometry';
import { fromExtent } from 'ol/geom/Polygon';
import { getHeight, getWidth, isEmpty, getCenter } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';

export class ExtentHelper {
  public static shrink(extent: OpenlayersExtent, size: number) {
    extent[0] += size;
    extent[1] += size;
    extent[2] -= size;
    extent[3] -= size;
  }

  public static toPolygon(extent: OpenlayersExtent): Geometry {
    return fromExtent(extent);
  }

  public static getWidth(extent: OpenlayersExtent): number {
    return getWidth(extent);
  }

  public static getHeight(extent: OpenlayersExtent): number {
    return getHeight(extent);
  }

  public static isEmpty(extent: OpenlayersExtent): boolean {
    return isEmpty(extent);
  }

  public static getCenter(extent: OpenlayersExtent): Coordinate {
    return getCenter(extent);
  }
}
