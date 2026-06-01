import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { FeatureSelectionBookmarkFragment } from './application-bookmark-fragments';
import { v4 as uuidv4 } from 'uuid';

export class FeatureSelectionBookmarkHelper {
  private static PART_SEPARATOR = ';';
  private static SERVICE_LAYER_SEPARATOR = '/';
  private static LAYER_SEPARATOR = ',';

  public static getFragmentFromBookmark(bookmark: string | null): FeatureSelectionBookmarkFragment | null {
    if (!bookmark) {
      return null;
    }
    const parts = bookmark.split(this.PART_SEPARATOR);
    const layersString: string | null = parts.find(part => part.startsWith('layers='))?.substring('layers='.length) || null;
    const attributeName: string | null = parts.find(
      part => part.startsWith('attributeName=')
    )?.substring('attributeName='.length) || null;
    const attributeValue: string | null = parts.find(
      part => part.startsWith('attributeValue=')
    )?.substring('attributeValue='.length) || null;
    console.debug(`Parsed feature selection bookmark - layers: ${layersString}, attributeName: ${attributeName}, attributeValue: ${attributeValue}`);
    if (!attributeName || !attributeValue || !layersString) {
      return null;
    }

    const layers = layersString
      .split(this.LAYER_SEPARATOR)
      .map(layerPair => layerPair.trim())
      .filter(layerPair => layerPair.length > 0)
      .map(layerPair => {
        const [serviceId, layerId] = layerPair.split(this.SERVICE_LAYER_SEPARATOR);
        if (!serviceId || !layerId) {
          throw new Error(`Invalid layer format: ${layerPair}`);
        }
        return { serviceId, layerId };
      });

    return {
      layers,
      attributeName,
      attributeValue,
    };
  }

  public static createFilterFromBookmarkFragment(
    featureSelectionFragment: FeatureSelectionBookmarkFragment | null,
  ): FilterGroupModel<AttributeFilterModel> | { errorMessage: string } | null {
    if (!featureSelectionFragment) {
      return null;
    }

    if (!featureSelectionFragment.layers || featureSelectionFragment.layers.length === 0) {
      return {
        errorMessage: 'No layers specified in FeatureSelectionBookmark',
      };
    }

    if (!featureSelectionFragment.attributeName || !featureSelectionFragment.attributeValue) {
      return {
        errorMessage: 'Attribute name and value are required in FeatureSelectionBookmark',
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
