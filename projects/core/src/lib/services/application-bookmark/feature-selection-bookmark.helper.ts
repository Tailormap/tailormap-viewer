import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { FeatureSelectionBookmarkFragment } from './application-bookmark-fragments';
import { v4 as uuidv4 } from 'uuid';

export class FeatureSelectionBookmarkHelper {
  public static createFilterFromBookmark(
    featureSelectionFragment: FeatureSelectionBookmarkFragment | null,
  ): FilterGroupModel<AttributeFilterModel> | { errorMessage: string } | null {
    if (!featureSelectionFragment) {
      return null;
    }

    if (!featureSelectionFragment.layers || featureSelectionFragment.layers.length === 0) {
      return {
        errorMessage: 'No layers specified in ObjectSelectionBookmark',
      };
    }

    if (!featureSelectionFragment.attributeName || !featureSelectionFragment.attributeValue) {
      return {
        errorMessage: 'Attribute name and value are required in ObjectSelectionBookmark',
      };
    }

    // todo: properly get correct appLayerIds
    const layerIds = featureSelectionFragment.layers.map(layer =>
      `lyr:${layer.serviceId}:${layer.layerId}`,
    );

    return {
      id: uuidv4(),
      source: 'FeatureSelectionBookmark',
      layerIds,
      type: FilterTypeEnum.ATTRIBUTE,
      operator: 'AND',
      filters: [
        {
          id: uuidv4(),
          type: FilterTypeEnum.ATTRIBUTE,
          attribute: featureSelectionFragment.attributeName,
          attributeType: AttributeType.STRING,
          condition: FilterConditionEnum.STRING_EQUALS_KEY,
          value: [featureSelectionFragment.attributeValue],
          invertCondition: false,
          caseSensitive: false,
        },
      ],
    };

  }
}
