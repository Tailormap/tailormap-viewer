import {
  AttributeFilterModel, AttributeType, FeaturesResponseModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { FeatureSelectionBookmarkFragment } from './application-bookmark-fragments';
import { v4 as uuidv4 } from 'uuid';
import { FeatureInfoResponseModel } from "../../components/feature-info/models/feature-info-response.model";

export interface FeatureSelectionMessage {
  type: 'tailormap-feature-selection';
  value: string;
}

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
      part => part.startsWith('attribute='),
    )?.substring('attribute='.length) || null;
    const attributeValue: string | null = parts.find(
      part => part.startsWith('value='),
    )?.substring('value='.length) || null;
    const createFilter: boolean = parts.find(
      part => part.startsWith('filter='),
    )?.substring('filter='.length) === 'true' || false;
    if (!attributeName || !attributeValue || !layersString) {
      return null;
    }

    const layers = layersString
      .split(this.LAYER_SEPARATOR)
      .map(layerPair => layerPair.trim())
      .filter(layerPair => layerPair.length > 0)
      .map(layerPair => {
        const layerParts = layerPair.split(this.SERVICE_LAYER_SEPARATOR);
        if (layerParts.length !== 2) {
          return null;
        }
        const [ serviceId, layerName ] = layerParts;
        if (!serviceId || !layerName) {
          return null;
        }
        return { serviceId, layerName };
      })
      .filter(layer => layer !== null);

    if (layers.length === 0) {
      return null;
    }

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
  ): FilterGroupModel<AttributeFilterModel> | { errorMessage: string } {
    if (!appLayerIds || appLayerIds.length === 0) {
      return {
        errorMessage: $localize `:@@core.feature-bookmark.no-layers:No layers specified in Feature Selection Bookmark`,
      };
    }
    if (!attributeName) {
      return {
        errorMessage: $localize `:@@core.feature-bookmark.no-attribute-name:No attribute name specified in Feature Selection Bookmark`,
      };
    }
    if (!attributeValue) {
      return {
        errorMessage: $localize `:@@core.feature-bookmark.no-attribute-value:No attribute value specified in Feature Selection Bookmark`,
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

  public static isFeatureSelectionMessage(data: unknown): data is FeatureSelectionMessage {
    return !!data
      && typeof data === 'object'
      && 'type' in data
      && data.type === 'tailormap-feature-selection'
      && 'value' in data
      && typeof data.value === 'string';
  }
}
