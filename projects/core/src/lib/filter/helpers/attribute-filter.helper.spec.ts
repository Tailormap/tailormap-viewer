import { FilterGroupModel } from '../models/filter-group.model';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { AttributeFilterHelper } from './attribute-filter.helper';
import { BaseFilterModel } from '../models/base-filter.model';
import { AttributeFilterModel } from '../models/attribute-filter.model';

export const getFilterGroup = <T extends BaseFilterModel = AttributeFilterModel>(
  filters?: T[],
  type?: FilterTypeEnum,
  id?: string,
):  FilterGroupModel<T> => {
  const attributeFilter: AttributeFilterModel = {
    id: id || '1',
    type: FilterTypeEnum.ATTRIBUTE,
    caseSensitive: false,
    invertCondition: false,
    attribute: 'attribute',
    attributeType: FeatureAttributeTypeEnum.STRING,
    condition: FilterConditionEnum.STRING_LIKE_KEY,
    value: ['value'],
  };
  return {
    id: '1',
    layerIds: ['1'],
    type: type || FilterTypeEnum.ATTRIBUTE,
    filters: filters || [attributeFilter as unknown as T],
    operator: 'AND',
    source: 'SOME_COMPONENT',
  };
};

describe('AttributeFilterHelper', () => {
  it('tests for valid filter', () => {
    expect(AttributeFilterHelper.isValidFilter(null)).toBe(false);
    expect(AttributeFilterHelper.isValidFilter(getFilterGroup<AttributeFilterModel>().filters[0])).toBe(true);
  });
});
