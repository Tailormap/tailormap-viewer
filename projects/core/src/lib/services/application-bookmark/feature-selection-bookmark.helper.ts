import {
  AttributeFilterModel, AttributeType, FeaturesResponseModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { FeatureSelectionBookmarkFragment } from './application-bookmark-fragments';
import { v4 as uuidv4 } from 'uuid';
import { FeatureInfoResponseModel } from '../../components';

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
      part => part.startsWith('attributeName='),
    )?.substring('attributeName='.length) || null;
    const attributeValue: string | null = parts.find(
      part => part.startsWith('attributeValue='),
    )?.substring('attributeValue='.length) || null;
    const createFilter: boolean = parts.find(
      part => part.startsWith('createFilter='),
    )?.substring('createFilter='.length) === 'true' || false;
    if (!attributeName || !attributeValue || !layersString) {
      return null;
    }

    const layers = layersString
      .split(this.LAYER_SEPARATOR)
      .map(layerPair => layerPair.trim())
      .filter(layerPair => layerPair.length > 0)
      .map(layerPair => {
        const [ serviceId, layerName ] = layerPair.split(this.SERVICE_LAYER_SEPARATOR);
        if (!serviceId || !layerName) {
          throw new Error(`Invalid layer format: ${layerPair}`);
        }
        return { serviceId, layerName: layerName };
      });

    return {
      layers,
      attributeName,
      attributeValue,
      createFilter,
    };
  }

  public static createFilterGroup(
    appLayerIds: string[],
    attributeName: string,
    attributeValue: string,
  ): FilterGroupModel<AttributeFilterModel> | { errorMessage: string } | null {
    if (!appLayerIds || appLayerIds.length === 0) {
      return {
        errorMessage: 'No layers specified in FeatureSelectionBookmark',
      };
    }

    if (!attributeName || !attributeValue) {
      return {
        errorMessage: 'Attribute name and value are required in FeatureSelectionBookmark',
      };
    }

    return {
      id: uuidv4(),
      source: 'FeatureSelectionBookmark',
      layerIds: appLayerIds,
      type: FilterTypeEnum.ATTRIBUTE,
      operator: 'AND',
      filters: [
        {
          id: uuidv4(),
          type: FilterTypeEnum.ATTRIBUTE,
          attribute: attributeName,
          attributeType: AttributeType.STRING,
          condition: FilterConditionEnum.STRING_EQUALS_KEY,
          value: [attributeValue],
          invertCondition: false,
          caseSensitive: false,
        },
      ],
    };
  }

  public static featuresToFeatureInfo(
    response: FeaturesResponseModel,
    layerId: string,
  ): FeatureInfoResponseModel {
    return {
      features: (response.features || []).map(f => ({ ...f, layerId })),
      columnMetadata: (response.columnMetadata || []).map(cm => ({ ...cm, layerId })),
      attachmentMetadata: (response.attachmentMetadata || []).map(am => ({ ...am, layerId })),
      template: response.template || null,
      layerId,
    };
  }
}
