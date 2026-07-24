import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import {
  AttributeFilterModel, AttributeType, AttributeTypeHelper, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { FeatureHelper } from '../../../shared/helpers/feature.helper';
import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../models/feature-info-column-metadata.model';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { nanoid } from 'nanoid';

export class FeatureInfoHelper {

  public static getTotalFeatureInfoCount(featureInfo: FeatureInfoResponseModel[]) {
    return featureInfo.reduce((totalCount, fI) => totalCount + fI.features.length, 0);
  }

  public static isLayerDisabled(layer: FeatureInfoLayerModel) {
    return layer.loading === LoadingStateEnum.LOADED ? layer.totalCount === 0 : false;
  }

  public static getGeometryForFeatureInfoFeature(feature: FeatureInfoFeatureModel, columnMetadata: FeatureInfoColumnMetadataModel[]): string | null {
    if (!feature) {
      return null;
    }
    if (feature.geometry) {
      return feature.geometry;
    }
    const geomAttribute = columnMetadata.find(c => AttributeTypeHelper.isGeometryType(c.type));
    if (!geomAttribute) {
      return null;
    }
    return FeatureHelper.getGeometryForFeature(feature, geomAttribute.name);
  }

  public static createAttributeFilter(
    layerId: string,
    attributeName: string,
    attributeValue: string,
    attributeType: AttributeType,
  ): FilterGroupModel<AttributeFilterModel> {
    let condition: FilterConditionEnum;
    switch (attributeType) {
      case AttributeType.STRING:
        condition = FilterConditionEnum.STRING_EQUALS_KEY;
        break;
      case AttributeType.NUMBER:
        condition = FilterConditionEnum.NUMBER_EQUALS_KEY;
        break;
      case AttributeType.BOOLEAN:
        condition = attributeValue === "true" ? FilterConditionEnum.BOOLEAN_TRUE_KEY : FilterConditionEnum.BOOLEAN_FALSE_KEY;
        break;
      default:
        condition = FilterConditionEnum.STRING_EQUALS_KEY;
    }
    return {
      id: nanoid(),
      source: "feature-info",
      layerIds: [layerId],
      type: FilterTypeEnum.ATTRIBUTE,
      filters: [{
        id: nanoid(),
        type: FilterTypeEnum.ATTRIBUTE,
        condition: condition,
        value: [attributeValue],
        attribute: attributeName,
        attributeType: attributeType,
        caseSensitive: false,
        invertCondition: false,
      }],
      operator: "AND",
    };
  }

}
