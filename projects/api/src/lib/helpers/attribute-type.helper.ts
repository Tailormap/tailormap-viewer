import { AttributeType } from '../models';

export class AttributeTypeHelper {

  private static GEOMETRY_TYPES: Set<AttributeType> = new Set([
    AttributeType.GEOMETRY,
    AttributeType.GEOMETRY_COLLECTION,
    AttributeType.MULTIPOLYGON,
    AttributeType.POLYGON,
    AttributeType.MULTILINESTRING,
    AttributeType.LINESTRING,
    AttributeType.MULTIPOINT,
    AttributeType.POINT,
  ]);

  public static isGeometryType(type: AttributeType | undefined) {
    return type && AttributeTypeHelper.GEOMETRY_TYPES.has(type);
  }

}
