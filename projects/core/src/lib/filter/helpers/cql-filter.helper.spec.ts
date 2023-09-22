import { FilterGroupModel } from '../models/filter-group.model';
import { AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { CqlFilterHelper } from './cql-filter.helper';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { getFilterGroup } from './attribute-filter.helper.spec';
import { SpatialFilterModel } from '../models/spatial-filter.model';

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

describe('CQLFilterHelper', () => {

  test('should create a basic CQL filter', () => {
    const filterGroup = getFilterGroup();
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('(attribute ILIKE \'%value%\')');
  });

  test('should create a spatial filter', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)']);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, POINT(1 2))');
  });

  test('should create a spatial filter for circle', () => {
    const filterGroup = getSpatialFilterGroup(['CIRCLE(1 2 3)']);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, BUFFER(POINT(1 2), 3))');
  });

  test('should create a spatial filter for multiple geometries', () => {
    const filterGroup = getSpatialFilterGroup([ 'POINT(1 2)', 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))' ]);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, GEOMETRYCOLLECTION(POINT(1 2),POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))))');
  });

  test('should create a spatial filters for multiple layers', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], [{ layerId: '1', column: ['the_geom'] }, { layerId: '2', column: ['geom'] }]);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.size).toBe(2);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, POINT(1 2))');
    expect(filters.get('2')).toBe('INTERSECTS(geom, POINT(1 2))');
  });

  test('should create a spatial filter for multiple geometry columns', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], [{ layerId: '1', column: [ 'the_geom', 'some_other_geom_column' ] }]);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('(INTERSECTS(the_geom, POINT(1 2)) OR INTERSECTS(some_other_geom_column, POINT(1 2)))');
  });

  test('should create a spatial filter with buffer', () => {
    const filterGroup = getSpatialFilterGroup(['POINT(1 2)'], undefined, 10);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, BUFFER(POINT(1 2), 10))');
  });

  test('should create a spatial filter for a circle with buffer', () => {
    const filterGroup = getSpatialFilterGroup(['CIRCLE(1 2 3)'], undefined, 10);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('INTERSECTS(the_geom, BUFFER(POINT(1 2), 13))');
  });

  test('combine multiple filters into a CQL filter', () => {
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
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get('1')).toBe('((attribute ILIKE \'%value%\') AND (attribute2 = true) AND (attribute3 = 2020-01-01) AND (attribute4 IS NOT NULL))');
  });

  test('should create a CQL filter for a tree of filters', () => {
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
    const filters = CqlFilterHelper.getFilters(filterGroups);
    expect(filters.get('1')).toBe('((attribute LIKE \'%value%\') AND ((((attribute2 > 5) OR (attribute3 < 10)) OR (attribute5 IS NULL)) AND (attribute4 BETWEEN 5 AND 10)))');
  });

});
