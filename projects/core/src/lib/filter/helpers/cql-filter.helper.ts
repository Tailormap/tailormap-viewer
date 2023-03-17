import { FilterGroupModel } from '../models/filter-group.model';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeHelper } from './filter-type.helper';
import { BaseFilterModel } from '../models/base-filter.model';
import { CqlSpatialFilterHelper } from './cql-spatial-filter.helper';

export class CqlFilterHelper {

  public static getFilters(filterGroups: FilterGroupModel[]): Map<string, string> {
    const cqlDict = new Map<string, string>();
    const layerIdList = filterGroups.reduce<string[]>((ids, f) => {
      return [ ...ids, ...f.layerIds ];
    }, []);
    const layerIds = new Set<string>(layerIdList);
    layerIds.forEach(layerId => {
      const filtersForLayer = filterGroups.filter(f => f.layerIds.includes(layerId));
      const cqlFilter = CqlFilterHelper.getFilterForLayer(filtersForLayer, layerId);
      if (cqlFilter) {
        cqlDict.set(layerId, cqlFilter);
      }
    });
    return cqlDict;
  }

  public static getFilterForLayer(filterGroups: FilterGroupModel[], layerId: string): string {
    const rootFilterGroups = filterGroups.filter(f => (typeof f.parentGroup === 'undefined' || f.parentGroup === null));
    return rootFilterGroups
      .map(f => CqlFilterHelper.getFilterForGroup(f, filterGroups, layerId))
      .filter(f => !!f && f !== '()')
      .join(' AND ');
  }

  private static getFilterForGroup(filterGroup: FilterGroupModel, allFilterGroups: FilterGroupModel[], layerId: string): string {
    const filter: string[] = [];
    const baseFilter: string[] = filterGroup.filters
      .map(f => CqlFilterHelper.convertFilterToQuery(f, layerId))
      .filter(TypesHelper.isDefined);
    filter.push(CqlFilterHelper.wrapFilters(baseFilter, filterGroup.operator));
    const childFilters = allFilterGroups.filter(f => f.parentGroup === filterGroup.id);
    if (childFilters.length > 0) {
      const childCql = childFilters.map(f => CqlFilterHelper.getFilterForGroup(f, allFilterGroups, layerId));
      filter.push(CqlFilterHelper.wrapFilters(childCql, filterGroup.operator));
    }
    return CqlFilterHelper.wrapFilters(filter, filterGroup.operator);
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
    const value = filter.value[0];
    if (CqlFilterHelper.isNumeric(filter.attributeType)
      && filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY
      && filter.value.length > 1) {
      return CqlFilterHelper.wrapFilter(`${filter.attribute} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`);
    }
    if (CqlFilterHelper.isNumeric(filter.attributeType)) {
      return CqlFilterHelper.wrapFilter(`${filter.attribute} ${filter.condition} ${value}`);
    }
    if (filter.attributeType === FeatureAttributeTypeEnum.STRING) {
      return CqlFilterHelper.wrapFilter(CqlFilterHelper.getQueryForString(filter));
    }
    if (CqlFilterHelper.isDate(filter.attributeType)) {
      return CqlFilterHelper.wrapFilter(CqlFilterHelper.getQueryForDate(filter));
    }
    if (filter.attributeType === FeatureAttributeTypeEnum.BOOLEAN) {
      return CqlFilterHelper.wrapFilter(`${filter.attribute} = ${filter.condition === FilterConditionEnum.BOOLEAN_TRUE_KEY ? 'true' : 'false'}`);
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
      query.push(CqlFilterHelper.getExpression(`${value}`, FeatureAttributeTypeEnum.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_LIKE_KEY) {
      query.push(CqlFilterHelper.getExpression(`%${value}%`, FeatureAttributeTypeEnum.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_STARTS_WITH_KEY) {
      query.push(CqlFilterHelper.getExpression(`${value}%`, FeatureAttributeTypeEnum.STRING));
    }
    if (filter.condition === FilterConditionEnum.STRING_ENDS_WITH_KEY) {
      query.push(CqlFilterHelper.getExpression(`%${value}`, FeatureAttributeTypeEnum.STRING));
    }
    return `${query.join(' ')}`;
  }

  private static getQueryForDate(filter: AttributeFilterModel) {
    const query: string[] = [filter.attribute];
    const isTimestampType = filter.attributeType === FeatureAttributeTypeEnum.TIMESTAMP;
    const isTimestampOnDate = isTimestampType && filter.condition === FilterConditionEnum.DATE_ON_KEY;
    if ((filter.condition === FilterConditionEnum.DATE_BETWEEN_KEY && filter.value.length > 1) || isTimestampOnDate) {
      const dateFrom = filter.value[0];
      const dateUntil = isTimestampOnDate ? filter.value[0] : filter.value[1];
      if (filter.invertCondition) {
        query.push('NOT');
      }
      query.push('BETWEEN');
      query.push(isTimestampType ? `${dateFrom}T00:00:00Z AND ${dateUntil}T23:59:59Z` : `${dateFrom} AND ${dateUntil}`);
      return `${query.join(' ')}`;
    }
    const cond = filter.condition === FilterConditionEnum.DATE_ON_KEY
      ? (filter.invertCondition ? '!=' : '=')
      : (filter.condition === 'AFTER' || filter.invertCondition) ? 'AFTER' : 'BEFORE';
    query.push(cond);
    const value = isTimestampType
      ? (cond === 'AFTER' ? `${filter.value[0]}T23:59:59Z` : `${filter.value[0]}T00:00:00Z`)
      : filter.value[0];
    query.push(value);
    return query.join(' ');
  }

  public static getExpression(value: string | number | boolean, attributeType: FeatureAttributeTypeEnum): string {
    if (attributeType === FeatureAttributeTypeEnum.STRING || CqlFilterHelper.isDate(attributeType)) {
      if (typeof value === 'string') {
        value = value.replace(/'/g, '\'\'');
      }
      return `'${value}'`;
    }
    return `${value}`;
  }

  private static isNumeric(attributeType: FeatureAttributeTypeEnum) {
    return attributeType === FeatureAttributeTypeEnum.DOUBLE || attributeType === FeatureAttributeTypeEnum.INTEGER;
  }

  private static isDate(attributeType: FeatureAttributeTypeEnum) {
    return attributeType === FeatureAttributeTypeEnum.DATE || attributeType === FeatureAttributeTypeEnum.TIMESTAMP;
  }

}
