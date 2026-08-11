import {
  AttributeFilterModel, AttributeType, AttributeValueSettings, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { LayerFeaturesFilters } from '../models/feature-filter.model';
import { DateTime } from 'luxon';
import { FilterTypeHelper } from './filter-type.helper';

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


  public static createAttributeFilter(
    attributeName: string,
    attributeValue: string,
    attributeType: AttributeType,
    attributeAlias?: string,
  ): Omit<AttributeFilterModel, 'id'> {
    const condition = FeaturesFilterHelper.getEqualsCondition(attributeType, attributeValue);
    const value = (attributeType === AttributeType.DATE || attributeType === AttributeType.TIMESTAMP)
      ? FeaturesFilterHelper.dateToDay(attributeValue)
      : attributeValue;
    return {
      type: FilterTypeEnum.ATTRIBUTE,
      condition: condition,
      value: attributeType === AttributeType.BOOLEAN ? [""] : [value],
      attribute: attributeName,
      attributeType: attributeType,
      caseSensitive: true,
      invertCondition: false,
      attributeAlias: attributeAlias,
    };
  }

  public static getEqualsCondition(type: AttributeType, value: string): FilterConditionEnum {
    switch (type) {
      case AttributeType.STRING:
        return FilterConditionEnum.STRING_EQUALS_KEY;
      case AttributeType.NUMBER:
      case AttributeType.INTEGER:
      case AttributeType.DOUBLE:
        return FilterConditionEnum.NUMBER_EQUALS_KEY;
      case AttributeType.BOOLEAN:
        return value === 'true' ? FilterConditionEnum.BOOLEAN_TRUE_KEY : FilterConditionEnum.BOOLEAN_FALSE_KEY;
      case AttributeType.DATE:
      case AttributeType.TIMESTAMP:
        return FilterConditionEnum.DATE_ON_KEY;
      default:
        return FilterConditionEnum.STRING_EQUALS_KEY;
    }
  }

  public static dateToDay(dateString: string): string {
    return DateTime.fromISO(dateString).toISODate() ?? '';
  }

  public static findExactFiltersInGroups(
    groups: FilterGroupModel[],
    attribute: string,
    attributeType: AttributeType,
    attributeValue: string,
    condition: FilterConditionEnum): string[] {
    return groups
      .flatMap(group =>
        group.filters
          .filter(
            filter =>
              FilterTypeHelper.isAttributeFilter(filter) &&
              filter.attributeType === attributeType &&
              filter.condition === condition &&
              filter.attribute === attribute &&
              !filter.invertCondition &&
              (filter.value[0] === attributeValue ||
                filter.value[0] === FeaturesFilterHelper.dateToDay(attributeValue)),
          )
          .map(filter => filter.id),
      );
  }

}
