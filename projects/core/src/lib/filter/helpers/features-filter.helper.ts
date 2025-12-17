import {
  AttributeFilterModel, AttributeValueSettings, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { LayerFeaturesFilters } from '../models/feature-filter.model';

export class FeaturesFilterHelper {

  public static readonly DEFAULT_FEATURE_TYPE_NAME = Symbol('default');

  public static getFilter(
    filters?: LayerFeaturesFilters | null,
    featureTypeName?: string | null,
  ): string | null {
    if (!filters) {
      return null;
    }
    const key = featureTypeName || FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME;
    return filters.get(key) ?? null;
  }

  public static separateSubstringFiltersInCheckboxFilters(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ): FilterGroupModel<AttributeFilterModel>[] {
    return filterGroups.map<FilterGroupModel<AttributeFilterModel>>(group => {
      if (group.type === FilterTypeEnum.ATTRIBUTE) {
        const allSubstringFilters: AttributeFilterModel[] = group.filters.map(filter => {
          if (filter.editConfiguration?.filterTool === FilterToolEnum.CHECKBOX) {
            return filter.editConfiguration.attributeValuesSettings
              .filter(value => value.useAsIlikeSubstringFilter)
              .map(value => FeaturesFilterHelper.getFilterForSubstringValue(filter, value));
          }
          return [];
        }).flat();
        return {
          ...group,
          filters: group.filters.concat(allSubstringFilters),
        };
      }
      return group;
    });
  }
  private static getFilterForSubstringValue(filter: AttributeFilterModel, value: AttributeValueSettings): AttributeFilterModel {
    return {
      attribute: filter.attribute,
      attributeType: filter.attributeType,
      caseSensitive: filter.caseSensitive,
      condition: FilterConditionEnum.STRING_LIKE_KEY,
      invertCondition: filter.invertCondition,
      disabled: !value.initiallySelected,
      value: [value.value],
      type: filter.type,
      id: `${filter.id}-substring-${value.value}`,
      generatedByFilterId: filter.id,
    };
  }

}
