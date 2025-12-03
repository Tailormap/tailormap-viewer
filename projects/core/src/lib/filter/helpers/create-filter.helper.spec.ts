import { AttributeType, FilterConditionEnum, FilterTypeEnum } from '@tailormap-viewer/api';
import { CreateFilterHelper } from './create-filter.helper';
import { getFilterGroup } from '../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';

describe('CreateFilterHelper', () => {

  test('should return CQL string format when type is CQL', () => {
    const filterGroup = getFilterGroup();
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL');

    const filter = filters.get('1');

    // Type check: filter should be string | undefined
    expect(typeof filter).toBe('string');
    expect(filter).toBe('(attribute ILIKE \'%value%\')');
  });

  test('should return CQL2 JSON format when type is CQL2JSON', () => {
    const filterGroup = getFilterGroup();
    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');

    const filter = filters.get('1');

    // Type check: filter should be Cql2JsonFilter | undefined
    expect(filter).toBeDefined();
    expect(filter).toHaveProperty('op');
    expect(filter).toEqual({
      op: 'like',
      args: [{ property: 'attribute' }, '%value%', true],
    });
  });

  test('should handle multiple filters with CQL format', () => {
    const filterGroup = getFilterGroup([
      {
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'city',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['Amsterdam'],
      },
      {
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'population',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
        value: ['100000'],
      },
    ]);

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL');
    const filter = filters.get('1');

    expect(filter).toBe('((city ILIKE \'%Amsterdam%\') AND (population > 100000))');
  });

  test('should handle multiple filters with CQL2JSON format', () => {
    const filterGroup = getFilterGroup([
      {
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'city',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['Amsterdam'],
      },
      {
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'population',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
        value: ['100000'],
      },
    ]);

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');

    expect(filter).toEqual({
      op: 'and',
      args: [
        { op: 'like', args: [{ property: 'city' }, '%Amsterdam%', true] },
        { op: '>', args: [{ property: 'population' }, 100000] },
      ],
    });
  });

  test('should handle multiple layers', () => {
    const filterGroup1 = getFilterGroup();
    filterGroup1.layerIds = ['1'];

    const filterGroup2 = getFilterGroup();
    filterGroup2.layerIds = ['2'];
    filterGroup2.filters[0].value = ['test'];

    const filters = CreateFilterHelper.getFilters([filterGroup1, filterGroup2], 'CQL');

    expect(filters.size).toBe(2);
    expect(filters.get('1')).toBe('(attribute ILIKE \'%value%\')');
    expect(filters.get('2')).toBe('(attribute ILIKE \'%test%\')');
  });

  test('should handle numeric filter with CQL format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].attributeType = AttributeType.INTEGER;
    filterGroup.filters[0].condition = FilterConditionEnum.NUMBER_BETWEEN_KEY;
    filterGroup.filters[0].value = ['10', '20'];

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL');
    const filter = filters.get('1');

    expect(filter).toBe('(attribute BETWEEN 10 AND 20)');
  });

  test('should handle numeric filter with CQL2JSON format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].attributeType = AttributeType.INTEGER;
    filterGroup.filters[0].condition = FilterConditionEnum.NUMBER_BETWEEN_KEY;
    filterGroup.filters[0].value = ['10', '20'];

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');

    expect(filter).toEqual({
      op: 'between',
      args: [{ property: 'attribute' }, 10, 20],
    });
  });

  test('should handle inverted condition with CQL format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.NULL_KEY;
    filterGroup.filters[0].invertCondition = true;

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL');
    const filter = filters.get('1');

    expect(filter).toBe('(attribute IS NOT NULL)');
  });

  test('should handle inverted condition with CQL2JSON format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.NULL_KEY;
    filterGroup.filters[0].invertCondition = true;

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');

    expect(filter).toEqual({
      op: 'not',
      args: [{ op: 'isNull', args: [{ property: 'attribute' }] }],
    });
  });

  test('should handle IN clause with CQL format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.UNIQUE_VALUES_KEY;
    filterGroup.filters[0].value = ['value1', 'value2', 'value3'];

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL');
    const filter = filters.get('1');

    expect(filter).toBe('(attribute IN (\'value1\',\'value2\',\'value3\'))');
  });

  test('should handle IN clause with CQL2JSON format', () => {
    const filterGroup = getFilterGroup();
    filterGroup.filters[0].condition = FilterConditionEnum.UNIQUE_VALUES_KEY;
    filterGroup.filters[0].value = ['value1', 'value2', 'value3'];

    const filters = CreateFilterHelper.getFilters([filterGroup], 'CQL2JSON');
    const filter = filters.get('1');

    expect(filter).toEqual({
      op: 'in',
      args: [{ property: 'attribute' }, ['value1', 'value2', 'value3']],
    });
  });

});
