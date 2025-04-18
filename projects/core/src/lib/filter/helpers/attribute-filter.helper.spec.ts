import { AttributeType, FilterGroupModel, FilterTypeEnum, BaseFilterModel, AttributeFilterModel } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from './attribute-filter.helper';

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
    attributeType: AttributeType.STRING,
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
