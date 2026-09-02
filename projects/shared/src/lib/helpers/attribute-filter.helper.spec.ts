import { AttributeFilterModel } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from './attribute-filter.helper';
import { getFilterGroup } from './attribute-filter.mock';

describe('AttributeFilterHelper', () => {
  it('tests for valid filter', () => {
    expect(AttributeFilterHelper.isValidFilter(null)).toBe(false);
    expect(AttributeFilterHelper.isValidFilter(getFilterGroup<AttributeFilterModel>().filters[0])).toBe(true);
  });
});
