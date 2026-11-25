import { describe, test, expect, vi } from 'vitest';
import {
  AttributeFilterModel, AttributeType, FeatureModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { getFilterGroup } from '@tailormap-viewer/shared';
import { GeometryHelper } from '@tailormap-viewer/map';
import { CqlFilterHelper } from './cql-filter.helper';
import { ClientSideFilterHelper } from './client-side-filter.helper';
import { FeaturesFilterHelper } from './features-filter.helper';
import { getSpatialFilterGroup } from './spatial-filter-group.mock';
import { Settings } from 'luxon';

const attributeFilter = (overrides: Partial<AttributeFilterModel>): AttributeFilterModel => ({
  id: '1',
  type: FilterTypeEnum.ATTRIBUTE,
  caseSensitive: false,
  invertCondition: false,
  attribute: 'attr',
  attributeType: AttributeType.STRING,
  condition: FilterConditionEnum.STRING_LIKE_KEY,
  value: ['value'],
  ...overrides,
});

const group = (filters: AttributeFilterModel[], overrides?: Partial<FilterGroupModel<AttributeFilterModel>>): FilterGroupModel =>
  ({ ...getFilterGroup(filters), ...overrides });

const feature = (attributes: Record<string, unknown>, geometry?: string): FeatureModel => ({ __fid: '1', attributes, geometry });

const square = 'POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))';
const bufferedSquare = 'POLYGON((-5 -5, 15 -5, 15 15, -5 15, -5 -5))';

interface FilterCase {
  name: string;
  groups: FilterGroupModel[];
  /** The CQL for layer '1', default feature type; undefined when there is no filter */
  cql: string | undefined;
  /** Features with whether they pass the filter */
  features: Array<[ FeatureModel, boolean ]>;
  /** Stubbed result of GeometryHelper.bufferWktGeometry */
  bufferResult?: string;
}

const cases: FilterCase[] = [
  {
    name: 'string like, case insensitive',
    groups: [group([attributeFilter({})])],
    cql: "(attr ILIKE '%value%')",
    features: [[ feature({ attr: 'some VALUE here' }), true ], [ feature({ attr: 'other' }), false ], [ feature({}), false ]],
  },
  {
    name: 'string equals, case sensitive, inverted',
    groups: [group([attributeFilter({ condition: FilterConditionEnum.STRING_EQUALS_KEY, caseSensitive: true, invertCondition: true })])],
    cql: "(attr NOT LIKE 'value')",
    features: [[ feature({ attr: 'value' }), false ], [ feature({ attr: 'Value' }), true ], [ feature({ attr: null }), false ]],
  },
  {
    name: 'string starts with and ends with',
    groups: [group([
      attributeFilter({ condition: FilterConditionEnum.STRING_STARTS_WITH_KEY, value: ['ab'] }),
      attributeFilter({ id: '2', condition: FilterConditionEnum.STRING_ENDS_WITH_KEY, value: ['yz'] }),
    ])],
    cql: "((attr ILIKE 'ab%') AND (attr ILIKE '%yz'))",
    features: [[ feature({ attr: 'ABcxyz' }), true ], [ feature({ attr: 'abc' }), false ], [ feature({ attr: 'xyz' }), false ]],
  },
  {
    name: 'string without value is skipped',
    groups: [group([attributeFilter({ value: [] })])],
    cql: undefined,
    features: [[ feature({ attr: 'anything' }), true ]],
  },
  {
    name: 'unique values',
    groups: [group([attributeFilter({ condition: FilterConditionEnum.UNIQUE_VALUES_KEY, value: [ 'a', "b'c" ] })])],
    cql: "(attr IN ('a','b''c'))",
    features: [[ feature({ attr: 'a' }), true ], [ feature({ attr: "b'c" }), true ], [ feature({ attr: 'A' }), false ]],
  },
  {
    name: 'unique numeric values, inverted',
    groups: [group([attributeFilter({
      condition: FilterConditionEnum.UNIQUE_VALUES_KEY, attributeType: AttributeType.INTEGER, value: [ '1', '2' ], invertCondition: true,
    })])],
    cql: '(attr NOT IN (1,2))',
    features: [[ feature({ attr: 1 }), false ], [ feature({ attr: 3 }), true ], [ feature({}), false ]],
  },
  {
    name: 'null and not null',
    groups: [group([
      attributeFilter({ condition: FilterConditionEnum.NULL_KEY, value: [] }),
      attributeFilter({ id: '2', attribute: 'other', condition: FilterConditionEnum.NULL_KEY, value: [], invertCondition: true }),
    ])],
    cql: '((attr IS NULL) AND (other IS NOT NULL))',
    features: [[ feature({ other: 1 }), true ], [ feature({ attr: null, other: 'x' }), true ], [ feature({ attr: 'x', other: 1 }), false ], [ feature({}), false ]],
  },
  {
    name: 'number comparisons',
    groups: [group([
      attributeFilter({ attributeType: AttributeType.INTEGER, condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY, value: ['5'] }),
      attributeFilter({ id: '2', attributeType: AttributeType.DOUBLE, condition: FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY, value: ['10'] }),
    ])],
    cql: '((attr > 5) AND (attr <= 10))',
    features: [[ feature({ attr: 5 }), false ], [ feature({ attr: '7' }), true ], [ feature({ attr: 10 }), true ], [ feature({ attr: 10.5 }), false ]],
  },
  {
    name: 'number inverted uses inverse condition',
    groups: [group([attributeFilter({
      attributeType: AttributeType.NUMBER, condition: FilterConditionEnum.NUMBER_EQUALS_KEY, value: ['3'], invertCondition: true,
    })])],
    cql: '(attr <> 3)',
    features: [[ feature({ attr: 3 }), false ], [ feature({ attr: 4 }), true ], [ feature({}), false ]],
  },
  {
    name: 'number between and not between',
    groups: [group([
      attributeFilter({ attributeType: AttributeType.INTEGER, condition: FilterConditionEnum.NUMBER_BETWEEN_KEY, value: [ '1', '10' ] }),
      attributeFilter({
        id: '2', attributeType: AttributeType.INTEGER, condition: FilterConditionEnum.NUMBER_BETWEEN_KEY, value: [ '4', '6' ], invertCondition: true,
      }),
    ])],
    cql: '((attr BETWEEN 1 AND 10) AND (attr NOT BETWEEN 4 AND 6))',
    features: [[ feature({ attr: 1 }), true ], [ feature({ attr: 5 }), false ], [ feature({ attr: 10 }), true ], [ feature({ attr: 11 }), false ]],
  },
  {
    name: 'number without value is skipped',
    groups: [group([attributeFilter({ attributeType: AttributeType.INTEGER, condition: FilterConditionEnum.NUMBER_EQUALS_KEY, value: [] })])],
    cql: undefined,
    features: [[ feature({ attr: 1 }), true ]],
  },
  {
    name: 'boolean true, and false inverted',
    groups: [group([
      attributeFilter({ attributeType: AttributeType.BOOLEAN, condition: FilterConditionEnum.BOOLEAN_TRUE_KEY, value: [] }),
      attributeFilter({
        id: '2', attribute: 'other', attributeType: AttributeType.BOOLEAN, condition: FilterConditionEnum.BOOLEAN_FALSE_KEY, value: [], invertCondition: true,
      }),
    ])],
    cql: '((attr = true) AND (other = true))',
    features: [[ feature({ attr: true, other: 'true' }), true ], [ feature({ attr: true, other: false }), false ], [ feature({ other: true }), false ]],
  },
  {
    name: 'boolean false',
    groups: [group([attributeFilter({ attributeType: AttributeType.BOOLEAN, condition: FilterConditionEnum.BOOLEAN_FALSE_KEY, value: [] })])],
    cql: '(attr = false)',
    features: [[ feature({ attr: false }), true ], [ feature({ attr: true }), false ], [ feature({ attr: null }), false ]],
  },
  {
    name: 'date on (compares days)',
    groups: [group([attributeFilter({ attributeType: AttributeType.TIMESTAMP, condition: FilterConditionEnum.DATE_ON_KEY, value: ['2024-03-05'] })])],
    cql: '(attr BETWEEN 2024-03-05T00:00:00.000Z AND 2024-03-05T23:59:59.999Z)',
    features: [[ feature({ attr: '2024-03-05T13:14:15Z' }), true ], [ feature({ attr: '2024-03-06' }), false ], [ feature({}), false ]],
  },
  {
    name: 'date not between',
    groups: [group([attributeFilter({
      attributeType: AttributeType.DATE, condition: FilterConditionEnum.DATE_BETWEEN_KEY, value: [ '2024-01-01', '2024-01-31' ], invertCondition: true,
    })])],
    cql: '(attr NOT BETWEEN 2024-01-01T00:00:00.000Z AND 2024-01-31T23:59:59.999Z)',
    features: [[ feature({ attr: '2024-01-31' }), false ], [ feature({ attr: '2023-12-31' }), true ], [ feature({ attr: '2024-02-01' }), true ]],
  },
  {
    name: 'date after and before',
    groups: [group([
      attributeFilter({ attributeType: AttributeType.DATE, condition: FilterConditionEnum.DATE_AFTER_KEY, value: ['2024-01-01'] }),
      attributeFilter({ id: '2', attributeType: AttributeType.DATE, condition: FilterConditionEnum.DATE_BEFORE_KEY, value: ['2024-02-01'] }),
    ])],
    cql: '((attr AFTER 2024-01-01T23:59:59.999Z) AND (attr BEFORE 2024-02-01T00:00:00.000Z))',
    features: [[ feature({ attr: '2024-01-01' }), false ], [ feature({ attr: '2024-01-02' }), true ], [ feature({ attr: '2024-02-01' }), false ]],
  },
  {
    name: 'date before inverted becomes after',
    groups: [group([attributeFilter({
      attributeType: AttributeType.DATE, condition: FilterConditionEnum.DATE_BEFORE_KEY, value: ['2024-01-01'], invertCondition: true,
    })])],
    cql: '(attr AFTER 2024-01-01T23:59:59.999Z)',
    features: [[ feature({ attr: '2024-01-01' }), false ], [ feature({ attr: '2024-01-02' }), true ]],
  },
  {
    name: 'disabled filters are skipped, OR operator',
    groups: [group([
      attributeFilter({ value: ['a'] }),
      attributeFilter({ id: '2', value: ['b'], disabled: true }),
      attributeFilter({ id: '3', attribute: 'other', value: ['c'] }),
    ], { operator: 'OR' })],
    cql: "((attr ILIKE '%a%') OR (other ILIKE '%c%'))",
    features: [[ feature({ attr: 'a' }), true ], [ feature({ attr: 'b', other: 'c' }), true ], [ feature({ attr: 'b' }), false ]],
  },
  {
    name: 'generated filters combine with OR with their original',
    groups: [group([
      attributeFilter({ condition: FilterConditionEnum.UNIQUE_VALUES_KEY, value: ['x'] }),
      attributeFilter({ id: '2', value: ['sub'], generatedByFilterId: '1' }),
      attributeFilter({ id: '3', value: ['off'], generatedByFilterId: '1', disabled: true }),
    ])],
    cql: "((attr IN ('x')) OR (attr ILIKE '%sub%'))",
    features: [[ feature({ attr: 'x' }), true ], [ feature({ attr: 'a sub b' }), true ], [ feature({ attr: 'off' }), false ]],
  },
  {
    name: 'nested groups and several root groups',
    groups: [
      group([attributeFilter({ value: ['a'] })], { id: 'root', operator: 'OR' }),
      group([
        attributeFilter({ id: '2', attribute: 'n', attributeType: AttributeType.INTEGER, condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY, value: ['1'] }),
      ], { id: 'child', parentGroup: 'root' }),
      group([attributeFilter({ id: '3', attribute: 'other', condition: FilterConditionEnum.NULL_KEY, value: [], invertCondition: true })], { id: 'root2' }),
    ],
    cql: "(((attr ILIKE '%a%') OR (n > 1)) AND (other IS NOT NULL))",
    features: [
      [ feature({ attr: 'a', other: 1 }), true ],
      [ feature({ n: 2, other: 1 }), true ],
      [ feature({ n: 1, other: 1 }), false ],
      [ feature({ attr: 'a' }), false ],
    ],
  },
  {
    name: 'filters for another feature type do not apply to the layer',
    groups: [group([attributeFilter({ featureType: 'related' })])],
    cql: undefined,
    features: [[ feature({ attr: 'other' }), true ]],
  },
  {
    name: 'groups for another layer do not apply',
    groups: [group([attributeFilter({})], { layerIds: ['2'] })],
    cql: undefined,
    features: [[ feature({ attr: 'other' }), true ]],
  },
  {
    name: 'spatial point',
    groups: [getSpatialFilterGroup(['POINT(5 5)'])],
    cql: 'INTERSECTS(the_geom, SRID=4326;POINT(5 5))',
    features: [
      [ feature({}, square), true ],
      [ feature({}, 'POINT(20 20)'), false ],
      [ feature({ the_geom: 'POINT(5 5)' }, 'POINT(20 20)'), true ],
      [ feature({}), false ],
    ],
  },
  {
    name: 'spatial multiple geometries with buffer',
    groups: [getSpatialFilterGroup([ 'POINT(100 100)', square ], undefined, 5)],
    bufferResult: bufferedSquare,
    cql: `INTERSECTS(the_geom, SRID=4326;${bufferedSquare})`,
    features: [[ feature({}, 'POINT(-3 -3)'), true ], [ feature({}, 'POINT(100 100)'), false ], [ feature({}, 'POINT(-6 0)'), false ]],
  },
  {
    name: 'spatial circles with buffer',
    groups: [getSpatialFilterGroup([ 'CIRCLE(0 0 10)', 'CIRCLE(100 0 1)' ], undefined, 2)],
    cql: `(INTERSECTS(the_geom, SRID=4326;${GeometryHelper.getCircleQueryWKT('CIRCLE(0 0 10)', 2)})`
      + ` OR INTERSECTS(the_geom, SRID=4326;${GeometryHelper.getCircleQueryWKT('CIRCLE(100 0 1)', 2)}))`,
    features: [
      [ feature({}, 'POINT(11 0)'), true ],
      [ feature({}, 'POINT(102.5 0)'), true ],
      [ feature({}, 'POINT(13 0)'), false ],
      [ feature({}, 'POINT(50 0)'), false ],
    ],
  },
  {
    name: 'spatial filter for a layer without geometry columns is skipped',
    groups: [getSpatialFilterGroup(['POINT(5 5)'], [{ layerId: '2', column: ['geom'] }, { layerId: '1', column: [] }])],
    cql: undefined,
    features: [[ feature({}, 'POINT(20 20)'), true ]],
  },
  {
    name: 'spatial and attribute filters combined',
    groups: [
      getSpatialFilterGroup([square]),
      group([attributeFilter({ value: ['a'] })], { id: '2' }),
    ],
    cql: "(INTERSECTS(the_geom, SRID=4326;POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))) AND (attr ILIKE '%a%'))",
    features: [[ feature({ attr: 'a' }, 'POINT(1 1)'), true ], [ feature({ attr: 'b' }, 'POINT(1 1)'), false ], [ feature({ attr: 'a' }, 'POINT(11 1)'), false ]],
  },
];

describe('ClientSideFilterHelper', () => {

  test.each(cases)('$name', ({ groups, cql, features, bufferResult }) => {
    if (bufferResult) {
      vi.spyOn(GeometryHelper, 'bufferWktGeometry').mockReturnValue(bufferResult);
    }
    expect(CqlFilterHelper.getFilters(groups).get('1')?.get(FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME)).toBe(cql);
    const predicate = ClientSideFilterHelper.getFeaturePredicate(groups, '1');
    features.forEach(([ f, expected ]) => {
      expect({ attributes: f.attributes, geometry: f.geometry, result: predicate(f) })
        .toEqual({ attributes: f.attributes, geometry: f.geometry, result: expected });
    });
  });

  test('compares timestamps as UTC days like the CQL, also when the browser is not in UTC', () => {
    const defaultZone = Settings.defaultZone;
    Settings.defaultZone = 'Europe/Amsterdam';
    try {
      const on = ClientSideFilterHelper.getFeaturePredicate([group([attributeFilter({
        attributeType: AttributeType.TIMESTAMP, condition: FilterConditionEnum.DATE_ON_KEY, value: ['2024-05-01'],
      })])], '1');
      expect(on(feature({ attr: '2024-05-01T23:30:00Z' }))).toBe(true);
      expect(on(feature({ attr: '2024-05-02T01:30:00+02:00' }))).toBe(true);
      const before = ClientSideFilterHelper.getFeaturePredicate([group([attributeFilter({
        attributeType: AttributeType.DATE, condition: FilterConditionEnum.DATE_BEFORE_KEY, value: ['2024-05-01'],
      })])], '1');
      expect(before(feature({ attr: 'not a date' }))).toBe(false);
    } finally {
      Settings.defaultZone = defaultZone;
    }
  });

  test('uses the filters of the given feature type', () => {
    const groups = [group([attributeFilter({ featureType: 'related' })])];
    const predicate = ClientSideFilterHelper.getFeaturePredicate(groups, '1', 'related');
    expect(predicate(feature({ attr: 'value' }))).toBe(true);
    expect(predicate(feature({ attr: 'other' }))).toBe(false);
  });

});
