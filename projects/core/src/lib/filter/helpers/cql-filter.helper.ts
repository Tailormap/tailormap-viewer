import { AttributeFilterModel, AttributeType, BaseFilterModel, FilterConditionEnum, FilterGroupModel } from '@tailormap-viewer/api';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeHelper } from './filter-type.helper';
import { CqlSpatialFilterHelper } from './cql-spatial-filter.helper';
import { FeaturesFilters, FeatureTypeName, LayerFeaturesFilters } from '../models/feature-filter.model';
import { FeaturesFilterHelper } from './features-filter.helper';

export class CqlFilterHelper {

  private static INVERSE_NUMBER_CONDITIONS: Map<FilterConditionEnum, FilterConditionEnum> = new Map([
    [ FilterConditionEnum.NUMBER_EQUALS_KEY, FilterConditionEnum.NUMBER_NOT_EQUALS_KEY ],
    [ FilterConditionEnum.NUMBER_LARGER_THAN_KEY, FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY ],
    [ FilterConditionEnum.NUMBER_SMALLER_THAN_KEY, FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY ],
    [ FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY, FilterConditionEnum.NUMBER_SMALLER_THAN_KEY ],
    [ FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY, FilterConditionEnum.NUMBER_LARGER_THAN_KEY ],
  ]);

  public static getFilters(filterGroups: FilterGroupModel[]): FeaturesFilters {
    const result: FeaturesFilters = new Map();
    const layerIdList = filterGroups.reduce<string[]>((ids, f) => {
      return [ ...ids, ...f.layerIds ];
    }, []);
    const layerIds = new Set<string>(layerIdList);
    layerIds.forEach(layerId => {
      const filtersForLayer = filterGroups.filter(f => f.layerIds.includes(layerId));
      const cqlFilters = CqlFilterHelper.getFilterForLayer(filtersForLayer, layerId);
      if (cqlFilters.size > 0) {
        result.set(layerId, cqlFilters);
      }
    });
    return result;
  }

  public static getFilterForLayer(filterGroups: FilterGroupModel[], layerId: string): LayerFeaturesFilters {
    const result: LayerFeaturesFilters = new Map();
    const rootFilterGroups = filterGroups.filter(f => (typeof f.parentGroup === 'undefined' || f.parentGroup === null));

    rootFilterGroups.forEach(group => {
      const groupResult = CqlFilterHelper.getFilterForGroup(group, filterGroups, layerId);
      groupResult.forEach((cql, featureTypeKey) => {
        const existingFilter = result.get(featureTypeKey);
        if (existingFilter) {
          result.set(featureTypeKey, CqlFilterHelper.wrapFilters([ existingFilter, cql ], 'AND'));
        } else {
          result.set(featureTypeKey, cql);
        }
      });
    });

    return result;
  }

  private static getFilterForGroup(filterGroup: FilterGroupModel, allFilterGroups: FilterGroupModel[], layerId: string): LayerFeaturesFilters {
    const result: LayerFeaturesFilters = new Map();

    // Group filters by featureType (or default feature type if no featureType)
    const generatedFilters = filterGroup.filters.filter(f => FilterTypeHelper.isAttributeFilter(f) && f.generatedByFilterId && !f.disabled);
    const originalFilters = filterGroup.filters
      .filter(f => !f.disabled
        && !(FilterTypeHelper.isAttributeFilter(f) && (f.generatedByFilterId || CqlFilterHelper.isNumericFilterWithNoValue(f))));

    // Group filters by their featureType key
    const filtersByFeatureType = this.groupFiltersByFeatureType(originalFilters);
    // Also group generated filters
    const generatedFiltersByFeatureType = this.groupFiltersByFeatureType(generatedFilters);

    // Process each featureType group
    filtersByFeatureType.forEach((filters, featureTypeKey) => {
      const filter: string[] = [];
      const baseFilter: string[] = filters
        .map(originalFilter => {
          const relevantGeneratedFilters = generatedFiltersByFeatureType.get(featureTypeKey) || [];
          const cqlQueries = [
            CqlFilterHelper.convertFilterToQuery(originalFilter, layerId),
            ...relevantGeneratedFilters.filter(
              generatedFilter => FilterTypeHelper.isAttributeFilter(generatedFilter) && generatedFilter.generatedByFilterId === originalFilter.id,
            ).map(generatedFilter => CqlFilterHelper.convertFilterToQuery(generatedFilter, layerId)),
          ].filter(TypesHelper.isDefined);
          return cqlQueries.length > 1
            ? CqlFilterHelper.wrapFilters(cqlQueries, 'OR')
            : cqlQueries[0];
        })
        .filter(TypesHelper.isDefined);
      filter.push(CqlFilterHelper.wrapFilters(baseFilter, filterGroup.operator));

      const cqlFilter = CqlFilterHelper.wrapFilters(filter, filterGroup.operator);
      if (cqlFilter && cqlFilter !== '()') {
        result.set(featureTypeKey, cqlFilter);
      }
    });

    // Process child filter groups
    const childFilters = allFilterGroups.filter(f => f.parentGroup === filterGroup.id);
    if (childFilters.length > 0) {
      childFilters.forEach(childGroup => {
        const childResult = CqlFilterHelper.getFilterForGroup(childGroup, allFilterGroups, layerId);
        childResult.forEach((childCql, featureTypeKey) => {
          const existingFilter = result.get(featureTypeKey);
          if (existingFilter) {
            result.set(featureTypeKey, CqlFilterHelper.wrapFilters([ existingFilter, childCql ], filterGroup.operator));
          } else {
            result.set(featureTypeKey, childCql);
          }
        });
      });
    }

    return result;
  }

  private static groupFiltersByFeatureType(filters: BaseFilterModel[]): Map<FeatureTypeName, BaseFilterModel[]> {
    const result = new Map<FeatureTypeName, BaseFilterModel[]>();
    filters.forEach(filter => {
      const key = filter.featureType || FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME;
      result.set(key, [ ...(result.get(key) || []), filter ]);
    });
    return result;
  }

  private static convertFilterToQuery(filter: BaseFilterModel, layerId: string): string | null {
    if (FilterTypeHelper.isAttributeFilter(filter)) {
      return CqlFilterHelper.convertAttributeFilterToQuery(filter, layerId);
    }
    if (FilterTypeHelper.isSpatialFilter(filter)) {
      return CqlSpatialFilterHelper.convertSpatialFilterToQuery(filter, layerId);
    }
    return null;
  }

  private static convertAttributeFilterToQuery(filter: AttributeFilterModel, _layerId: string): string | null {
    if (filter.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      if (filter.value.length === 0) {
        return null;
      }
      const uniqueValList = filter.value.map(v => CqlFilterHelper.getExpression(v, filter.attributeType)).join(',');
      return CqlFilterHelper.wrapFilter(`${filter.attribute}${filter.invertCondition ? ' NOT' : ''} IN (${uniqueValList})`);
    }
    if (filter.condition === FilterConditionEnum.NULL_KEY) {
      return CqlFilterHelper.wrapFilter(`${filter.attribute} IS${filter.invertCondition ? ' NOT' : ''} NULL`);
    }
    if (CqlFilterHelper.isNumeric(filter.attributeType)
      && filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY
      && filter.value.length > 1) {
      return CqlFilterHelper.wrapFilter(`${filter.attribute}${filter.invertCondition ? ' NOT' : ''} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`);
    }
    if (CqlFilterHelper.isNumeric(filter.attributeType)) {
      return CqlFilterHelper.wrapFilter(CqlFilterHelper.getQueryForNumber(filter));
    }
    if (filter.attributeType === AttributeType.STRING) {
      return CqlFilterHelper.wrapFilter(CqlFilterHelper.getQueryForString(filter));
    }
    if (CqlFilterHelper.isDate(filter.attributeType)) {
      return CqlFilterHelper.wrapFilter(CqlFilterHelper.getQueryForDate(filter));
    }
    if (filter.attributeType === AttributeType.BOOLEAN) {
      const isTrue = filter.condition === FilterConditionEnum.BOOLEAN_TRUE_KEY ||
        (filter.condition === FilterConditionEnum.BOOLEAN_FALSE_KEY && filter.invertCondition);
      return CqlFilterHelper.wrapFilter(`${filter.attribute} = ${isTrue ? 'true' : 'false'}`);
    }
    return null;
  }

  private static wrapFilter(cql: string) {
    return `(${cql})`;
  }

  private static wrapFilters(cqlFilters: string[], operator: 'AND' | 'OR') {
    if (cqlFilters.length === 0) {
      return '';
    }
    return cqlFilters.length === 1
      ? cqlFilters[0]
      : CqlFilterHelper.wrapFilter(cqlFilters.join(` ${operator} `));
  }

  private static getQueryForString(filter: AttributeFilterModel) {
    const query: string[] = [filter.attribute];
    const value = filter.value[0];
    if (filter.invertCondition) {
      query.push('NOT');
    }
    query.push(filter.caseSensitive ? 'LIKE' : 'ILIKE');
    if (filter.condition === FilterConditionEnum.STRING_EQUALS_KEY) {
      query.push(CqlFilterHelper.getExpression(`${value}`, AttributeType.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_LIKE_KEY) {
      query.push(CqlFilterHelper.getExpression(`%${value}%`, AttributeType.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_STARTS_WITH_KEY) {
      query.push(CqlFilterHelper.getExpression(`${value}%`, AttributeType.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_ENDS_WITH_KEY) {
      query.push(CqlFilterHelper.getExpression(`%${value}`, AttributeType.STRING));
    }
    return `${query.join(' ')}`;
  }

  private static getQueryForDate(filter: AttributeFilterModel) {
    const query: string[] = [filter.attribute];
    const isTimestampOnDate = filter.condition === FilterConditionEnum.DATE_ON_KEY;
    if ((filter.condition === FilterConditionEnum.DATE_BETWEEN_KEY && filter.value.length > 1) || isTimestampOnDate) {
      const dateFrom = filter.value[0];
      const dateUntil = isTimestampOnDate ? filter.value[0] : filter.value[1];
      if (filter.invertCondition) {
        query.push('NOT');
      }
      query.push('BETWEEN');
      query.push(`${CqlFilterHelper.addTimePartToDate(dateFrom, true)} AND ${CqlFilterHelper.addTimePartToDate(dateUntil, false)}`);
      return `${query.join(' ')}`;
    }
    const cond = filter.condition === FilterConditionEnum.DATE_ON_KEY
      ? (filter.invertCondition ? '!=' : '=')
      : (filter.condition === 'AFTER' || filter.invertCondition) ? 'AFTER' : 'BEFORE';
    query.push(cond);
    const value = CqlFilterHelper.addTimePartToDate(filter.value[0], cond !== 'AFTER');
    query.push(value);
    return query.join(' ');
  }

  private static addTimePartToDate(filterValue: string, isStart: boolean): string {
    if (filterValue.includes('T')) {
      const hasTimezoneOffset = /[+-]\d{2}(:?\d{2})?$/.test(filterValue);
      return (filterValue.endsWith('Z') || hasTimezoneOffset) ? filterValue : `${filterValue}Z`;
    }
    return isStart ? `${filterValue}T00:00:00Z` : `${filterValue}T23:59:59Z`;
  }

  private static getQueryForNumber(filter: AttributeFilterModel) {
    if (filter.invertCondition && CqlFilterHelper.INVERSE_NUMBER_CONDITIONS.get(filter.condition)) {
      return `${filter.attribute} ${CqlFilterHelper.INVERSE_NUMBER_CONDITIONS.get(filter.condition)} ${filter.value[0]}`;
    }
    return `${filter.attribute} ${filter.condition} ${filter.value[0]}`;
  }

  public static getExpression(value: string | number | boolean, attributeType: AttributeType): string {
    if (attributeType === AttributeType.STRING || CqlFilterHelper.isDate(attributeType)) {
      if (typeof value === 'string') {
        value = value.replace(/'/g, '\'\'');
      }
      return `'${value}'`;
    }
    return `${value}`;
  }

  private static isNumeric(attributeType: AttributeType) {
    return attributeType === AttributeType.DOUBLE || attributeType === AttributeType.INTEGER || attributeType === AttributeType.NUMBER;
  }

  private static isDate(attributeType: AttributeType) {
    return attributeType === AttributeType.DATE || attributeType === AttributeType.TIMESTAMP;
  }

  private static isNumericFilterWithNoValue(filter: AttributeFilterModel) {
    return CqlFilterHelper.isNumeric(filter.attributeType)
      && (filter.condition !== FilterConditionEnum.NULL_KEY)
      && (!filter.value || filter.value.length === 0);
  }
}
