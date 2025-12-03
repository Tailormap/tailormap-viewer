import { FilterGroupModel } from '@tailormap-viewer/api';
import { AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { getFilterGroup } from '../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';
import { SpatialFilterModel } from '@tailormap-viewer/api';
import { CreateFilterHelper } from './create-filter.helper';

export const getSpatialFilterGroup = (geoms: string[], columns?: Array<{ layerId: string; column: string[] }>, buffer?: number) => {
  const group = getFilterGroup<SpatialFilterModel>([{
    id: '1',
    type: FilterTypeEnum.SPATIAL,
    geometryColumns: columns || [{ layerId: '1', column: ['the_geom'] }],
    geometries: geoms.map((g, idx) => ({ id: `${idx + 1}`, geometry: g })),
    buffer,
  }], FilterTypeEnum.SPATIAL);
  if (columns) {
    return { ...group, layerIds: columns.map(c => c.layerId) };
  }
  return group;
};

const simpleNumberFilter = (condition?: FilterConditionEnum, value?: string[], invertCondition = false) => {
  const filterGroup = getFilterGroup();
  filterGroup.filters[0].attributeType = AttributeType.INTEGER;
  filterGroup.filters[0].condition = condition || FilterConditionEnum.NUMBER_SMALLER_THAN_KEY;
  filterGroup.filters[0].value = value || ['1'];
  filterGroup.filters[0].invertCondition = invertCondition;
  const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
  return filters.get('1');
};

describe('CQL2JSONFilterHelper', () => {

  test('should create a basic CQL2 JSON filter for string LIKE', () => {
    const filterGroup = getFilterGroup();
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');
    expect(filter).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, '%value%', true ],
    });
  });

  test('should create a basic number CQL2 JSON filter', () => {
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_SMALLER_THAN_KEY)).toEqual({
      op: '<',
      args: [{ property: 'attribute' }, 1 ],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY)).toEqual({
      op: '>=',
      args: [{ property: 'attribute' }, 1 ],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_BETWEEN_KEY, [ '0', '1' ])).toEqual({
      op: 'between',
      args: [{ property: 'attribute' }, 0, 1 ],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_EQUALS_KEY)).toEqual({
      op: '=',
      args: [{ property: 'attribute' }, 1 ],
    });
  });

  test('should create a basic number CQL2 JSON filter with inverse condition true', () => {
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_SMALLER_THAN_KEY, ['1'], true)).toEqual({
      op: '>=',
      args: [{ property: 'attribute' }, 1 ],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY, ['1'], true)).toEqual({
      op: '<',
      args: [{ property: 'attribute' }, 1 ],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_BETWEEN_KEY, [ '0', '1' ], true)).toEqual({
      op: 'not',
      args: [{ op: 'between', args: [{ property: 'attribute' }, 0, 1 ] }],
    });
    expect(simpleNumberFilter(FilterConditionEnum.NUMBER_EQUALS_KEY, ['1'], true)).toEqual({
      op: '<>',
      args: [{ property: 'attribute' }, 1 ],
    });
  });

  test('should create a spatial filter for point', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)']);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');
    expect(filter).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        { type: 'Point', coordinates: [ 1, 2 ] },
      ],
    });
  });

  test('should create a spatial filter for circle', () => {
    const filterGroup = getSpatialFilterGroup(['CIRCLE(1 2 3)']);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');
    expect(filter).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        {
          function: 'buffer',
          args: [{ type: 'Point', coordinates: [ 1, 2 ] }, 3 ],
        },
      ],
    });
  });

  test('should create a spatial filter for multiple geometries', () => {
    const filterGroup = getSpatialFilterGroup([ 'POINT(1 2)', 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))' ]);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');
    expect(filter).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        {
          type: 'GeometryCollection',
          coordinates: [
            { type: 'Point', coordinates: [ 1, 2 ] },
            { type: 'Polygon', coordinates: [[[ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ]]] },
          ],
        },
      ],
    });
  });

  test('should create spatial filters for multiple layers', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], [{ layerId: '1', column: ['the_geom'] }, { layerId: '2', column: ['geom'] }]);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.size).toBe(2);
    expect(filters.get('1')).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        { type: 'Point', coordinates: [ 1, 2 ] },
      ],
    });
    expect(filters.get('2')).toEqual({
      op: 's_intersects',
      args: [
        { property: 'geom' },
        { type: 'Point', coordinates: [ 1, 2 ] },
      ],
    });
  });

  test('should create a spatial filter for multiple geometry columns', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], [{ layerId: '1', column: [ 'the_geom', 'some_other_geom_column' ] }]);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'or',
      args: [
        {
          op: 's_intersects',
          args: [
            { property: 'the_geom' },
            { type: 'Point', coordinates: [ 1, 2 ] },
          ],
        },
        {
          op: 's_intersects',
          args: [
            { property: 'some_other_geom_column' },
            { type: 'Point', coordinates: [ 1, 2 ] },
          ],
        },
      ],
    });
  });

  test('should create a spatial filter with buffer', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], undefined, 10);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        {
          function: 'buffer',
          args: [{ type: 'Point', coordinates: [ 1, 2 ] }, 10 ],
        },
      ],
    });
  });

  test('should create a spatial filter for a circle with buffer', () => {
    const filterGroup = getSpatialFilterGroup(['CIRCLE(1 2 3)'], undefined, 10);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 's_intersects',
      args: [
        { property: 'the_geom' },
        {
          function: 'buffer',
          args: [{ type: 'Point', coordinates: [ 1, 2 ] }, 13 ],
        },
      ],
    });
  });

  test('combine multiple filters into a CQL2 JSON filter', () => {
    const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['value'],
      }, {
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute2',
        attributeType: AttributeType.BOOLEAN,
        condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
        value: [],
      }, {
        id: '3',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute3',
        attributeType: AttributeType.DATE,
        condition: FilterConditionEnum.DATE_ON_KEY,
        value: ['2020-01-01'],
      }, {
        id: '4',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: true,
        attribute: 'attribute4',
        attributeType: AttributeType.DATE,
        condition: FilterConditionEnum.NULL_KEY,
        value: [],
    }]);
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'and',
      args: [
        { op: 'like', args: [{ property: 'attribute' }, '%value%', true ] },
        { op: '=', args: [{ property: 'attribute2' }, true ] },
        { op: 'between', args: [{ property: 'attribute3' }, '2020-01-01T00:00:00Z', '2020-01-01T23:59:59Z' ] },
        { op: 'not', args: [{ op: 'isNull', args: [{ property: 'attribute4' }] }] },
      ],
    });
  });

  test('should create a CQL2 JSON filter for a tree of filters', () => {
    const filterGroups: FilterGroupModel<AttributeFilterModel>[] = [{
      id: '1',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: ['1'],
      filters: [{
        id: '1',
        caseSensitive: true,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['value'],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
    }, {
      id: '2',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: ['1'],
      filters: [{
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute2',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
        value: ['5'],
      }, {
        id: '3',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute3',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_SMALLER_THAN_KEY,
        value: ['10'],
      }],
      operator: 'OR',
      source: 'SOME_COMPONENT',
      parentGroup: '1',
    }, {
      id: '3',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: ['1'],
      filters: [{
        id: '4',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute4',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_BETWEEN_KEY,
        value: [ '5', '10' ],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
      parentGroup: '1',
    }, {
      id: '4',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: ['1'],
      filters: [{
        id: '5',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute5',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.NULL_KEY,
        value: [],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
      parentGroup: '2',
    }];
    const filters = CreateFilterHelper.getFilters(filterGroups, 'CQL2JSON');
    const filter = filters.get('1');
    expect(filter).toEqual({
      op: 'and',
      args: [
        { op: 'like', args: [{ property: 'attribute' }, '%value%' ] },
        {
          op: 'or',
          args: [
            { op: '>', args: [{ property: 'attribute2' }, 5 ] },
            { op: '<', args: [{ property: 'attribute3' }, 10 ] },
            { op: 'isNull', args: [{ property: 'attribute5' }] },
          ],
        },
        { op: 'between', args: [{ property: 'attribute4' }, 5, 10 ] },
      ],
    });
  });

  test('should create a CQL2 JSON filter for IN clause', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.UNIQUE_VALUES_KEY;
    filterGroup.filters[0].value = [ 'value1', 'value2', 'value3' ];
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'in',
      args: [{ property: 'attribute' }, [ 'value1', 'value2', 'value3' ]],
    });
  });

  test('should handle string filters with different conditions', () => {
    const baseFilterGroup = getFilterGroup();

    // EQUALS
    baseFilterGroup.filters[0].condition = FilterConditionEnum.STRING_EQUALS_KEY;
    baseFilterGroup.filters[0].value = ['test'];
    let filters = CreateFilterHelper.getFilters([baseFilterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, 'test', true ],
    });

    // STARTS_WITH
    baseFilterGroup.filters[0].condition = FilterConditionEnum.STRING_STARTS_WITH_KEY;
    filters = CreateFilterHelper.getFilters([baseFilterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, 'test%', true ],
    });

    // ENDS_WITH
    baseFilterGroup.filters[0].condition = FilterConditionEnum.STRING_ENDS_WITH_KEY;
    filters = CreateFilterHelper.getFilters([baseFilterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, '%test', true ],
    });
  });

  test('should handle case sensitive string filters', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].caseSensitive = true;
    filterGroup.filters[0].condition = FilterConditionEnum.STRING_LIKE_KEY;
    filterGroup.filters[0].value = ['test'];
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, '%test%' ],
    });
  });

  test('should handle date filters', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].attributeType = AttributeType.DATE;
    filterGroup.filters[0].condition = FilterConditionEnum.DATE_AFTER_KEY;
    filterGroup.filters[0].value = ['2020-01-01'];
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: '>',
      args: [{ property: 'attribute' }, '2020-01-01T23:59:59Z' ],
    });
  });

  test('should handle date BETWEEN filter', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].attributeType = AttributeType.DATE;
    filterGroup.filters[0].condition = FilterConditionEnum.DATE_BETWEEN_KEY;
    filterGroup.filters[0].value = [ '2020-01-01', '2020-12-31' ];
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'between',
      args: [{ property: 'attribute' }, '2020-01-01T00:00:00Z', '2020-12-31T23:59:59Z' ],
    });
  });

  test('should handle NOT NULL filter using not operator', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.NULL_KEY;
    filterGroup.filters[0].invertCondition = true;
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'not',
      args: [{ op: 'isNull', args: [{ property: 'attribute' }] }],
    });
  });

  test('should handle NOT IN filter using not operator', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.UNIQUE_VALUES_KEY;
    filterGroup.filters[0].value = [ 'value1', 'value2', 'value3' ];
    filterGroup.filters[0].invertCondition = true;
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'not',
      args: [{ op: 'in', args: [{ property: 'attribute' }, [ 'value1', 'value2', 'value3' ]] }],
    });
  });

  test('should handle NOT LIKE filter using not operator', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.STRING_LIKE_KEY;
    filterGroup.filters[0].value = ['test'];
    filterGroup.filters[0].invertCondition = true;
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'not',
      args: [{ op: 'like', args: [{ property: 'attribute' }, '%test%', true ] }],
    });
  });

  test('should handle NOT BETWEEN filter for dates using not operator', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].attributeType = AttributeType.DATE;
    filterGroup.filters[0].condition = FilterConditionEnum.DATE_BETWEEN_KEY;
    filterGroup.filters[0].value = [ '2020-01-01', '2020-12-31' ];
    filterGroup.filters[0].invertCondition = true;
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    expect(filters.get('1')).toEqual({
      op: 'not',
      args: [{ op: 'between', args: [{ property: 'attribute' }, '2020-01-01T00:00:00Z', '2020-12-31T23:59:59Z' ] }],
    });
  });

});
