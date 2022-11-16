import { FilterGroupModel } from '../models/filter-group.model';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { CqlFilterHelper } from './cql-filter.helper';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { getFilterGroup } from './attribute-filter.helper.spec';

describe('CQLFilterHelper', () => {

  test('should create a basic CQL filter', () => {
    const filterGroup = getFilterGroup();
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get(1)).toBe('(attribute ILIKE \'%value%\')');
  });

  test('combine multiple filters into a CQL filter', () => {
    const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute',
        attributeType: FeatureAttributeTypeEnum.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['value'],
      }, {
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute2',
        attributeType: FeatureAttributeTypeEnum.BOOLEAN,
        condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
        value: [],
      }, {
        id: '3',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute3',
        attributeType: FeatureAttributeTypeEnum.DATE,
        condition: FilterConditionEnum.DATE_ON_KEY,
        value: ['2020-01-01'],
      }, {
        id: '4',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: true,
        attribute: 'attribute4',
        attributeType: FeatureAttributeTypeEnum.DATE,
        condition: FilterConditionEnum.NULL_KEY,
        value: [],
      }]);
    const filters = CqlFilterHelper.getFilters([filterGroup]);
    expect(filters.get(1)).toBe('((attribute ILIKE \'%value%\') AND (attribute2 = true) AND (attribute3 = 2020-01-01) AND (attribute4 IS NOT NULL))');
  });

  test('should create a CQL filter for a tree of filters', () => {
    const filterGroups: FilterGroupModel<AttributeFilterModel>[] = [{
      id: '1',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: [1],
      filters: [{
        id: '1',
        caseSensitive: true,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute',
        attributeType: FeatureAttributeTypeEnum.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['value'],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
    }, {
      id: '2',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: [1],
      filters: [{
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute2',
        attributeType: FeatureAttributeTypeEnum.INTEGER,
        condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
        value: ['5'],
      }, {
        id: '3',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute3',
        attributeType: FeatureAttributeTypeEnum.INTEGER,
        condition: FilterConditionEnum.NUMBER_SMALLER_THAN_KEY,
        value: ['10'],
      }],
      operator: 'OR',
      source: 'SOME_COMPONENT',
      parentGroup: '1',
    }, {
      id: '3',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: [1],
      filters: [{
        id: '4',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute4',
        attributeType: FeatureAttributeTypeEnum.INTEGER,
        condition: FilterConditionEnum.NUMBER_BETWEEN_KEY,
        value: [ '5', '10' ],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
      parentGroup: '1',
    }, {
      id: '4',
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: [1],
      filters: [{
        id: '5',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute5',
        attributeType: FeatureAttributeTypeEnum.STRING,
        condition: FilterConditionEnum.NULL_KEY,
        value: [],
      }],
      operator: 'AND',
      source: 'SOME_COMPONENT',
      parentGroup: '2',
    }];
    const filters = CqlFilterHelper.getFilters(filterGroups);
    expect(filters.get(1)).toBe('((attribute LIKE \'%value%\') AND ((((attribute2 > 5) OR (attribute3 < 10)) OR (attribute5 IS NULL)) AND (attribute4 BETWEEN 5 AND 10)))');
  });

});
