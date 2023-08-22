import { AttributeTypeEnum } from "@tailormap-admin/admin-api";

export class FeatureTypeAttributeHelper {

  private static GEOMETRY_TYPES: Set<AttributeTypeEnum> = new Set([
    AttributeTypeEnum.GEOMETRY,
    AttributeTypeEnum.GEOMETRY_COLLECTION,
    AttributeTypeEnum.MULTIPOLYGON,
    AttributeTypeEnum.POLYGON,
    AttributeTypeEnum.MULTILINESTRING,
    AttributeTypeEnum.LINESTRING,
    AttributeTypeEnum.MULTIPOINT,
    AttributeTypeEnum.POINT,
  ]);

  public static isGeometryType(type: AttributeTypeEnum) {
    return FeatureTypeAttributeHelper.GEOMETRY_TYPES.has(type);
  }

}
