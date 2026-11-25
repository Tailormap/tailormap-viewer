import {
  AttributeFilterModel, AttributeType, BaseFilterModel, FeatureModel, FilterConditionEnum, FilterGroupModel, SpatialFilterModel,
} from '@tailormap-viewer/api';
import { GeometryHelper } from '@tailormap-viewer/map';
import { CqlFilterHelper, FilterGroupOutput } from './cql-filter.helper';
import { CqlSpatialFilterHelper } from './cql-spatial-filter.helper';
import { FeaturesFilterHelper } from './features-filter.helper';
import { FilterTypeHelper } from './filter-type.helper';
import { DateTime } from 'luxon';

export type FeaturePredicate = (feature: FeatureModel) => boolean;

/**
 * Evaluates filters on features in the browser, for data loaders that hold their features client-side.
 * Uses the same traversal as the CQL output ({@link CqlFilterHelper.traverseFilterGroups}), and each leaf mirrors the CQL
 * that {@link CqlFilterHelper} writes for it, so both outputs select the same features.
 * A missing attribute value never matches a condition, also not an inverted one (as NULL in SQL), except for the NULL condition.
 */
export class ClientSideFilterHelper {

  private static PREDICATE_OUTPUT: FilterGroupOutput<FeaturePredicate> = {
    convert: (filter, layerId) => ClientSideFilterHelper.convertFilterToPredicate(filter, layerId),
    combine: (predicates, operator) => {
      if (predicates.length === 1) {
        return predicates[0];
      }
      return operator === 'AND'
        ? feature => predicates.every(p => p(feature))
        : feature => predicates.some(p => p(feature));
    },
  };

  /**
   * Builds a predicate that tells whether a feature of a layer passes the filters, the client-side equivalent of
   * `CqlFilterHelper.getFilters(filterGroups).get(layerId)?.get(featureType)`.
   * Build it once per filter change and call it for every feature: spatial filter geometries are parsed when it is built.
   *
   * @param filterGroups the filter groups, as passed to data loaders in `filterGroups` (groups for other layers are ignored)
   * @param layerId the layer the features belong to
   * @param featureType the feature type name, or none for the layer itself
   */
  public static getFeaturePredicate(filterGroups: FilterGroupModel[], layerId: string, featureType?: string | null): FeaturePredicate {
    const groupsForLayer = filterGroups.filter(group => group.layerIds.includes(layerId));
    const predicates = CqlFilterHelper.traverseFilterGroups(groupsForLayer, layerId, ClientSideFilterHelper.PREDICATE_OUTPUT);
    return predicates.get(featureType || FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME) ?? (() => true);
  }

  private static convertFilterToPredicate(filter: BaseFilterModel, layerId: string): FeaturePredicate | null {
    if (FilterTypeHelper.isAttributeFilter(filter)) {
      return ClientSideFilterHelper.convertAttributeFilterToPredicate(filter);
    }
    if (FilterTypeHelper.isSpatialFilter(filter)) {
      return ClientSideFilterHelper.convertSpatialFilterToPredicate(filter, layerId);
    }
    return null;
  }

  private static convertSpatialFilterToPredicate(filter: SpatialFilterModel, layerId: string): FeaturePredicate | null {
    if (filter.geometries.length === 0) {
      return null;
    }
    const columns = filter.geometryColumns.find(gc => gc.layerId === layerId)?.column || [];
    const filterGeometries = CqlSpatialFilterHelper.getFilterGeometries(filter);
    if (columns.length === 0 || filterGeometries.length === 0) {
      return null;
    }
    const intersects = GeometryHelper.intersects(filterGeometries);
    return feature => columns.some(column => {
      // Use the geometry attribute when the feature has it as WKT, otherwise the feature geometry
      const value = feature.attributes[column];
      const wkt = typeof value === 'string' ? value : feature.geometry;
      return !!wkt && intersects(wkt, feature);
    });
  }

  private static convertAttributeFilterToPredicate(filter: AttributeFilterModel): FeaturePredicate | null {
    const attribute = filter.attribute;
    const invert = filter.invertCondition;
    const withValue = (test: (value: unknown) => boolean): FeaturePredicate => feature => {
      const value = feature.attributes[attribute];
      if (value === null || typeof value === 'undefined') {
        return false;
      }
      return test(value) !== invert;
    };
    if (filter.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      if (filter.value.length === 0) {
        return null;
      }
      return withValue(value => filter.value.some(v => ClientSideFilterHelper.equals(value, v, filter.attributeType)));
    }
    if (filter.condition === FilterConditionEnum.NULL_KEY) {
      return feature => {
        const value = feature.attributes[attribute];
        return (value === null || typeof value === 'undefined') !== invert;
      };
    }
    if (CqlFilterHelper.isNumeric(filter.attributeType)
      && filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY
      && filter.value.length > 1) {
      const [ from, until ] = [ Number(filter.value[0]), Number(filter.value[1]) ];
      return withValue(value => Number(value) >= from && Number(value) <= until);
    }
    if (CqlFilterHelper.isNumeric(filter.attributeType)) {
      return ClientSideFilterHelper.getPredicateForNumber(filter);
    }
    if (filter.attributeType === AttributeType.STRING) {
      if (filter.value.length === 0) {
        return null;
      }
      return ClientSideFilterHelper.getPredicateForString(filter, withValue);
    }
    if (CqlFilterHelper.isDate(filter.attributeType)) {
      return ClientSideFilterHelper.getPredicateForDate(filter);
    }
    if (filter.attributeType === AttributeType.BOOLEAN) {
      // Mirrors the CQL: only FALSE takes the inversion into account
      const isTrue = filter.condition === FilterConditionEnum.BOOLEAN_TRUE_KEY ||
        (filter.condition === FilterConditionEnum.BOOLEAN_FALSE_KEY && filter.invertCondition);
      return feature => {
        const value = feature.attributes[attribute];
        if (value === null || typeof value === 'undefined') {
          return false;
        }
        return (value === true || `${value}` === 'true') === isTrue;
      };
    }
    return null;
  }

  private static getPredicateForNumber(filter: AttributeFilterModel): FeaturePredicate {
    // Mirrors the CQL: the inversion is applied by using the inverse condition, when there is one
    const inverseCondition = CqlFilterHelper.INVERSE_NUMBER_CONDITIONS.get(filter.condition);
    const condition = filter.invertCondition && inverseCondition ? inverseCondition : filter.condition;
    const filterValue = Number(filter.value[0]);
    const compare = ClientSideFilterHelper.getNumberComparison(condition);
    return feature => {
      const value = feature.attributes[filter.attribute];
      if (value === null || typeof value === 'undefined' || !compare) {
        return false;
      }
      return compare(Number(value), filterValue);
    };
  }

  private static getNumberComparison(condition: FilterConditionEnum): ((value: number, filterValue: number) => boolean) | null {
    switch (condition) {
      case FilterConditionEnum.NUMBER_EQUALS_KEY: return (a, b) => a === b;
      case FilterConditionEnum.NUMBER_NOT_EQUALS_KEY: return (a, b) => a !== b;
      case FilterConditionEnum.NUMBER_LARGER_THAN_KEY: return (a, b) => a > b;
      case FilterConditionEnum.NUMBER_SMALLER_THAN_KEY: return (a, b) => a < b;
      case FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY: return (a, b) => a >= b;
      case FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY: return (a, b) => a <= b;
      default: return null;
    }
  }

  private static getPredicateForString(
    filter: AttributeFilterModel,
    withValue: (test: (value: unknown) => boolean) => FeaturePredicate,
  ): FeaturePredicate {
    const normalize = (value: string) => filter.caseSensitive ? value : value.toLocaleLowerCase();
    const filterValue = normalize(`${filter.value[0]}`);
    const match = ((): ((value: string) => boolean) => {
      switch (filter.condition) {
        case FilterConditionEnum.STRING_EQUALS_KEY: return value => value === filterValue;
        case FilterConditionEnum.STRING_LIKE_KEY: return value => value.includes(filterValue);
        case FilterConditionEnum.STRING_STARTS_WITH_KEY: return value => value.startsWith(filterValue);
        case FilterConditionEnum.STRING_ENDS_WITH_KEY: return value => value.endsWith(filterValue);
        default: return () => false;
      }
    })();
    return withValue(value => match(normalize(`${value}`)));
  }

  private static getPredicateForDate(filter: AttributeFilterModel): FeaturePredicate {
    // Dates compare as UTC days (ISO dates compare as strings). A value that is not a date never matches, as NULL.
    const dayOf = (feature: FeatureModel) => ClientSideFilterHelper.toDay(feature.attributes[filter.attribute]);
    const isTimestampOnDate = filter.condition === FilterConditionEnum.DATE_ON_KEY;
    if ((filter.condition === FilterConditionEnum.DATE_BETWEEN_KEY && filter.value.length > 1) || isTimestampOnDate) {
      const from = ClientSideFilterHelper.toDay(filter.value[0]) ?? '';
      const until = isTimestampOnDate ? from : ClientSideFilterHelper.toDay(filter.value[1]) ?? '';
      return feature => {
        const day = dayOf(feature);
        return day !== null && (day >= from && day <= until) !== filter.invertCondition;
      };
    }
    if (filter.value.length === 0) {
      return () => false;
    }
    // Mirrors the CQL: an inverted condition always becomes AFTER, also for AFTER itself
    const after = filter.condition === FilterConditionEnum.DATE_AFTER_KEY || filter.invertCondition;
    const filterDay = ClientSideFilterHelper.toDay(filter.value[0]) ?? '';
    return feature => {
      const day = dayOf(feature);
      return day !== null && (after ? day > filterDay : day < filterDay);
    };
  }

  /**
   * The UTC day (yyyy-MM-dd) of an ISO date or timestamp, or null when the value is not one. UTC, not the browser zone,
   * because the CQL compares with UTC bounds (FeaturesFilterHelper.dateToDay uses the browser zone).
   */
  private static toDay(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }
    return DateTime.fromISO(`${value}`, { zone: 'utc' }).toISODate();
  }

  private static equals(value: unknown, filterValue: string, attributeType: AttributeType): boolean {
    if (CqlFilterHelper.isNumeric(attributeType)) {
      return Number(value) === Number(filterValue);
    }
    if (CqlFilterHelper.isDate(attributeType)) {
      const day = ClientSideFilterHelper.toDay(value);
      return day !== null && day === ClientSideFilterHelper.toDay(filterValue);
    }
    return `${value}` === filterValue;
  }

}
