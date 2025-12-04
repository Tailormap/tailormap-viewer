import { AttributeFilterModel, AttributeType, BaseFilterModel, FilterConditionEnum, FilterGroupModel } from '@tailormap-viewer/api';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeHelper } from './filter-type.helper';
import { Cql2JsonSpatialFilterHelper } from './cql2-json-spatial-filter.helper';
import { INVERSE_NUMBER_CONDITIONS } from './inverse-filter-conditions.const';
import {
  Cql2JsonBetweenOp, Cql2JsonFilter, Cql2JsonInOp, Cql2JsonIsNullOp, Cql2JsonLikeOp, Cql2JsonProperty, NumberComparisonOperator,
} from '../models/cql2-json-filter.model';

export class Cql2JsonFilterHelper {

  public static getFilterForLayer(filterGroups: FilterGroupModel[], layerId: string): Cql2JsonFilter | null {
    const rootFilterGroups = filterGroups.filter(f => (typeof f.parentGroup === 'undefined' || f.parentGroup === null));
    const filters = rootFilterGroups
      .map(f => Cql2JsonFilterHelper.getFilterForGroup(f, filterGroups, layerId))
      .filter(TypesHelper.isDefined);

    if (filters.length === 0) {
      return null;
    }
    if (filters.length === 1) {
      return filters[0];
    }
    return { op: 'and', args: filters };
  }

  private static getFilterForGroup(filterGroup: FilterGroupModel, allFilterGroups: FilterGroupModel[], layerId: string): Cql2JsonFilter | null {
    const filters: Cql2JsonFilter[] = [];
    const generatedFilters = filterGroup.filters.filter(f => FilterTypeHelper.isAttributeFilter(f) && f.generatedByFilterId && !f.disabled);
    const originalFilters = filterGroup.filters
      .filter(f => !f.disabled
        && !(FilterTypeHelper.isAttributeFilter(f) && (f.generatedByFilterId || Cql2JsonFilterHelper.isNumericFilterWithNoValue(f))));

    originalFilters.forEach(originalFilter => {
      const cqlQueries: Cql2JsonFilter[] = [
        Cql2JsonFilterHelper.convertFilterToQuery(originalFilter, layerId),
        ...generatedFilters.filter(
          generatedFilter => FilterTypeHelper.isAttributeFilter(generatedFilter) && generatedFilter.generatedByFilterId === originalFilter.id,
        ).map(generatedFilter => Cql2JsonFilterHelper.convertFilterToQuery(generatedFilter, layerId)),
      ].filter(TypesHelper.isDefined);

      if (cqlQueries.length > 1) {
        filters.push({ op: 'or', args: cqlQueries });
      } else if (cqlQueries.length === 1) {
        filters.push(cqlQueries[0]);
      }
    });

    const childFilters = allFilterGroups.filter(f => f.parentGroup === filterGroup.id);
    if (childFilters.length > 0) {
      const childCql = childFilters
        .map(f => Cql2JsonFilterHelper.getFilterForGroup(f, allFilterGroups, layerId))
        .filter(TypesHelper.isDefined);
      filters.push(...childCql);
    }

    if (filters.length === 0) {
      return null;
    }
    if (filters.length === 1) {
      return filters[0];
    }
    const operator = filterGroup.operator.toLowerCase() as 'and' | 'or';
    return { op: operator, args: filters };
  }

  private static convertFilterToQuery(filter: BaseFilterModel, layerId: string): Cql2JsonFilter | null {
    if (FilterTypeHelper.isAttributeFilter(filter)) {
      return Cql2JsonFilterHelper.convertAttributeFilterToQuery(filter, layerId);
    }
    if (FilterTypeHelper.isSpatialFilter(filter)) {
      return Cql2JsonSpatialFilterHelper.convertSpatialFilterToQuery(filter, layerId);
    }
    return null;
  }

  private static convertAttributeFilterToQuery(filter: AttributeFilterModel, _layerId: string): Cql2JsonFilter | null {
    const property: Cql2JsonProperty = { property: filter.attribute };

    // Handle UNIQUE_VALUES (IN operator)
    if (filter.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      if (filter.value.length === 0) {
        return null;
      }
      const values = filter.value.map(v => Cql2JsonFilterHelper.getValue(v, filter.attributeType));
      const inOp: Cql2JsonInOp = { op: 'in', args: [ property, values ] };

      if (filter.invertCondition) {
        return { op: 'not', args: [inOp] };
      }
      return inOp;
    }

    // Handle NULL check
    if (filter.condition === FilterConditionEnum.NULL_KEY) {
      const isNullOp: Cql2JsonIsNullOp = { op: 'isNull', args: [property] };

      if (filter.invertCondition) {
        return { op: 'not', args: [isNullOp] };
      }
      return isNullOp;
    }

    // Handle BETWEEN for numeric values
    if (Cql2JsonFilterHelper.isNumeric(filter.attributeType)
      && filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY
      && filter.value.length > 1) {
      const lower = parseFloat(filter.value[0]);
      const upper = parseFloat(filter.value[1]);
      const betweenOp: Cql2JsonBetweenOp = { op: 'between', args: [ property, lower, upper ] };

      if (filter.invertCondition) {
        return { op: 'not', args: [betweenOp] };
      }
      return betweenOp;
    }

    // Handle numeric comparisons
    if (Cql2JsonFilterHelper.isNumeric(filter.attributeType)) {
      return Cql2JsonFilterHelper.getQueryForNumber(filter, property);
    }

    // Handle string comparisons
    if (filter.attributeType === AttributeType.STRING) {
      return Cql2JsonFilterHelper.getQueryForString(filter, property);
    }

    // Handle date comparisons
    if (Cql2JsonFilterHelper.isDate(filter.attributeType)) {
      return Cql2JsonFilterHelper.getQueryForDate(filter, property);
    }

    // Handle boolean
    if (filter.attributeType === AttributeType.BOOLEAN) {
      const isTrue = filter.condition === FilterConditionEnum.BOOLEAN_TRUE_KEY ||
        (filter.condition === FilterConditionEnum.BOOLEAN_FALSE_KEY && filter.invertCondition);
      return { op: '=', args: [ property, isTrue ] };
    }

    return null;
  }

  private static getQueryForString(filter: AttributeFilterModel, property: Cql2JsonProperty): Cql2JsonFilter | null {
    const value = filter.value[0];
    let pattern = '';

    if (filter.condition === FilterConditionEnum.STRING_EQUALS_KEY) {
      pattern = value;
    } else if (filter.condition === FilterConditionEnum.STRING_LIKE_KEY) {
      pattern = `%${value}%`;
    } else if (filter.condition === FilterConditionEnum.STRING_STARTS_WITH_KEY) {
      pattern = `${value}%`;
    } else if (filter.condition === FilterConditionEnum.STRING_ENDS_WITH_KEY) {
      pattern = `%${value}`;
    } else {
      return null;
    }

    // CQL2 like operator: args are [property, pattern, nocase (optional)]
    const likeOp: Cql2JsonLikeOp = filter.caseSensitive
      ? { op: 'like', args: [ property, pattern ] }
      : { op: 'like', args: [ property, pattern, true ] };

    if (filter.invertCondition) {
      return { op: 'not', args: [likeOp] };
    }

    return likeOp;
  }

  private static getQueryForDate(filter: AttributeFilterModel, property: Cql2JsonProperty): Cql2JsonFilter | null {
    const onDateFilter = filter.condition === FilterConditionEnum.DATE_ON_KEY;
    if ((filter.condition === FilterConditionEnum.DATE_BETWEEN_KEY && filter.value.length > 1) || onDateFilter) {
      const dateFrom = `${filter.value[0]}T00:00:00Z`;
      const dateUntil = onDateFilter ? `${filter.value[0]}T23:59:59Z` : `${filter.value[1]}T23:59:59Z`;
      const betweenOp: Cql2JsonBetweenOp = { op: 'between', args: [ property, dateFrom, dateUntil ] };

      if (filter.invertCondition) {
        return { op: 'not', args: [betweenOp] };
      }
      return betweenOp;
    }

    // Handle AFTER/BEFORE
    let operator: NumberComparisonOperator;
    let dateValue = '';

    if (filter.condition === FilterConditionEnum.DATE_AFTER_KEY) {
      operator = filter.invertCondition ? '<=' : '>';
      dateValue = `${filter.value[0]}T23:59:59Z`;
    } else if (filter.condition === FilterConditionEnum.DATE_BEFORE_KEY) {
      operator = filter.invertCondition ? '>=' : '<';
      dateValue = `${filter.value[0]}T00:00:00Z`;
    } else {
      return null;
    }

    return { op: operator, args: [ property, dateValue ] };
  }

  private static getQueryForNumber(filter: AttributeFilterModel, property: Cql2JsonProperty): Cql2JsonFilter | null {
    const value = parseFloat(filter.value[0]);
    let condition = filter.condition;

    // Apply inversion for numeric conditions
    const inverseCondition = filter.invertCondition
      ? INVERSE_NUMBER_CONDITIONS.get(filter.condition) ?? null
      : null;
    if (inverseCondition !== null) {
      condition = inverseCondition;
    }

    let operator: NumberComparisonOperator;
    switch (condition) {
      case FilterConditionEnum.NUMBER_EQUALS_KEY:
        operator = '=';
        break;
      case FilterConditionEnum.NUMBER_NOT_EQUALS_KEY:
        operator = '<>';
        break;
      case FilterConditionEnum.NUMBER_LARGER_THAN_KEY:
        operator = '>';
        break;
      case FilterConditionEnum.NUMBER_SMALLER_THAN_KEY:
        operator = '<';
        break;
      case FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY:
        operator = '>=';
        break;
      case FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY:
        operator = '<=';
        break;
      default:
        return null;
    }

    return { op: operator, args: [ property, value ] };
  }

  private static getValue(value: string | number | boolean, attributeType: AttributeType): string | number | boolean {
    if (attributeType === AttributeType.STRING || Cql2JsonFilterHelper.isDate(attributeType)) {
      return String(value);
    }
    if (Cql2JsonFilterHelper.isNumeric(attributeType)) {
      return typeof value === 'number' ? value : parseFloat(String(value));
    }
    return value;
  }

  private static isNumeric(attributeType: AttributeType) {
    return attributeType === AttributeType.DOUBLE || attributeType === AttributeType.INTEGER || attributeType === AttributeType.NUMBER;
  }

  private static isDate(attributeType: AttributeType) {
    return attributeType === AttributeType.DATE || attributeType === AttributeType.TIMESTAMP;
  }

  private static isNumericFilterWithNoValue(filter: AttributeFilterModel) {
    return Cql2JsonFilterHelper.isNumeric(filter.attributeType)
      && (filter.condition !== FilterConditionEnum.NULL_KEY)
      && (!filter.value || filter.value.length === 0);
  }
}
