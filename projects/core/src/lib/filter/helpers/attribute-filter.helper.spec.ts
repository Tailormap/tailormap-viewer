import { FilterGroupModel } from '../models/filter-group.model';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { AttributeFilterHelper } from './attribute-filter.helper';
import { SpatialFilterModel } from '../models/spatial-filter.model';

export const getFilterGroup = (filters?: (AttributeFilterModel | SpatialFilterModel)[],
                               type = FilterTypeEnum.ATTRIBUTE):  FilterGroupModel<AttributeFilterModel | SpatialFilterModel> => {
  return {
    id: '1',
    layerIds: [1],
    type,
    filters: filters || [{
      id: '1',
      type: FilterTypeEnum.ATTRIBUTE,
      caseSensitive: false,
      invertCondition: false,
      attribute: 'attribute',
      attributeType: FeatureAttributeTypeEnum.STRING,
      condition: FilterConditionEnum.STRING_LIKE_KEY,
      value: ['value'],
    }],
    operator: 'AND',
    source: 'SOME_COMPONENT',
  };
};

describe('AttributeFilterHelper', () => {
  it('tests for valid filter', () => {
    expect(AttributeFilterHelper.isValidFilter(null)).toBe(false);
    expect(AttributeFilterHelper.isValidFilter(getFilterGroup().filters[0])).toBe(true);
  });
});
