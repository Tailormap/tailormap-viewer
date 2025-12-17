import {
  FilterConditionEnum, FilterToolEnum, FilterTypeEnum, AttributeType, FilterGroupModel, CheckboxFilterModel, AttributeFilterModel,
} from '@tailormap-viewer/api';
import { FeaturesFilterHelper } from './features-filter.helper';
import { LayerFeaturesFilters } from '../models/feature-filter.model';
import { getFilterGroup } from '../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';

describe('FeaturesFilterHelper', () => {

  describe('getFilter', () => {

    it('should return null when filters is null', () => {
      const result = FeaturesFilterHelper.getFilter(null);
      expect(result).toBeNull();
    });

    it('should return null when filters is undefined', () => {
      const result = FeaturesFilterHelper.getFilter(undefined);
      expect(result).toBeNull();
    });

    it('should return filter for default feature type when featureTypeName is not provided', () => {
      const filters: LayerFeaturesFilters = new Map();
      filters.set(FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'test filter');
      const result = FeaturesFilterHelper.getFilter(filters);
      expect(result).toBe('test filter');
    });

    it('should return filter for default feature type when featureTypeName is null', () => {
      const filters: LayerFeaturesFilters = new Map();
      filters.set(FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'test filter');
      const result = FeaturesFilterHelper.getFilter(filters, null);
      expect(result).toBe('test filter');
    });

    it('should return null when default feature type filter does not exist', () => {
      const filters: LayerFeaturesFilters = new Map();
      filters.set('some-feature-type', 'test filter');
      const result = FeaturesFilterHelper.getFilter(filters);
      expect(result).toBeNull();
    });

    it('should return filter for specific feature type', () => {
      const filters: LayerFeaturesFilters = new Map();
      filters.set('feature-type-a', 'filter for type A');
      filters.set('feature-type-b', 'filter for type B');
      const result = FeaturesFilterHelper.getFilter(filters, 'feature-type-b');
      expect(result).toBe('filter for type B');
    });

    it('should return null when specific feature type filter does not exist', () => {
      const filters: LayerFeaturesFilters = new Map();
      filters.set('feature-type-a', 'filter for type A');
      const result = FeaturesFilterHelper.getFilter(filters, 'feature-type-b');
      expect(result).toBeNull();
    });

  });

  describe('separateSubstringFiltersInCheckboxFilters', () => {

    it('should return empty array when input is empty', () => {
      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([]);
      expect(result).toEqual([]);
    });

    it('should not modify filter groups without checkbox filters', () => {
      const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'attribute',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['value'],
      }]);
      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([filterGroup]);
      expect(result).toEqual([filterGroup]);
    });

    it('should separate substring filters from checkbox filters', () => {
      const editConfiguration: CheckboxFilterModel = {
        filterTool: FilterToolEnum.CHECKBOX,
        attributeValuesSettings: [
          { value: 'active', alias: 'Active', initiallySelected: true, selectable: true, useAsIlikeSubstringFilter: true },
          { value: 'pending', alias: 'Pending', initiallySelected: false, selectable: true, useAsIlikeSubstringFilter: true },
        ],
      };
      const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'status',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        value: [ 'active', 'pending' ],
        editConfiguration,
      }]);
      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([filterGroup]);

      expect(result.length).toBe(1);
      expect(result[0].filters.length).toBe(3); // Original + 2 substring filters

      // Check that the original filter is still there
      expect(result[0].filters[0].id).toBe('1');

      // Check the first substring filter
      expect(result[0].filters[1].id).toBe('1-substring-active');
      expect(result[0].filters[1].attribute).toBe('status');
      expect(result[0].filters[1].condition).toBe(FilterConditionEnum.STRING_LIKE_KEY);
      expect(result[0].filters[1].value).toEqual(['active']);
      expect(result[0].filters[1].disabled).toBe(false);
      expect(result[0].filters[1].generatedByFilterId).toBe('1');

      // Check the second substring filter
      expect(result[0].filters[2].id).toBe('1-substring-pending');
      expect(result[0].filters[2].attribute).toBe('status');
      expect(result[0].filters[2].condition).toBe(FilterConditionEnum.STRING_LIKE_KEY);
      expect(result[0].filters[2].value).toEqual(['pending']);
      expect(result[0].filters[2].disabled).toBe(true);
      expect(result[0].filters[2].generatedByFilterId).toBe('1');
    });

    it('should only create substring filters for values marked with useAsIlikeSubstringFilter', () => {
      const editConfiguration: CheckboxFilterModel = {
        filterTool: FilterToolEnum.CHECKBOX,
          attributeValuesSettings: [
          { value: 'active', alias: 'Active', selectable: true, initiallySelected: true, useAsIlikeSubstringFilter: true },
          { value: 'pending', alias: 'Pending', selectable: true, initiallySelected: false, useAsIlikeSubstringFilter: false },
          { value: 'completed', alias: 'Completed', selectable: true, initiallySelected: true, useAsIlikeSubstringFilter: true },
        ],
      };
      const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'status',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        value: [ 'active', 'pending', 'completed' ],
        editConfiguration,
      }]);

      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([filterGroup]);

      expect(result.length).toBe(1);
      expect(result[0].filters.length).toBe(3); // Original + 2 substring filters (not 3)

      // Check that only substring filters for 'active' and 'completed' were created
      const substringFilterIds = result[0].filters.slice(1).map(f => f.id);
      expect(substringFilterIds).toContain('1-substring-active');
      expect(substringFilterIds).toContain('1-substring-completed');
      expect(substringFilterIds).not.toContain('1-substring-pending');
    });

    it('should handle multiple filter groups', () => {
      const filterGroup1 = getFilterGroup([{
        id: '1',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'status',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        value: ['active'],
        editConfiguration: {
          filterTool: FilterToolEnum.CHECKBOX,
          attributeValuesSettings: [
            { value: 'active', label: 'Active', initiallySelected: true, useAsIlikeSubstringFilter: true },
          ],
        },
      }], FilterTypeEnum.ATTRIBUTE, '1');

      const filterGroup2 = getFilterGroup([{
        id: '2',
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: false,
        attribute: 'category',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['test'],
      }], FilterTypeEnum.ATTRIBUTE, '2');

      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([ filterGroup1, filterGroup2 ]);

      expect(result.length).toBe(2);
      expect(result[0].filters.length).toBe(2); // Original + 1 substring filter
      expect(result[1].filters.length).toBe(1); // No substring filters added
    });

    it('should preserve filter properties when creating substring filters', () => {
      const editConfiguration: CheckboxFilterModel = {
        filterTool: FilterToolEnum.CHECKBOX,
        attributeValuesSettings: [
          { value: 'active', alias: 'Active', selectable: true, initiallySelected: true, useAsIlikeSubstringFilter: true },
        ],
      };
      const filterGroup = getFilterGroup([{
        id: '1',
        caseSensitive: true,
        type: FilterTypeEnum.ATTRIBUTE,
        invertCondition: true,
        attribute: 'status',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        value: ['active'],
        editConfiguration,
      }]);

      const result = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters([filterGroup]);

      const substringFilter = result[0].filters[1];
      expect(substringFilter.attribute).toBe('status');
      expect(substringFilter.attributeType).toBe(AttributeType.STRING);
      expect(substringFilter.caseSensitive).toBe(true);
      expect(substringFilter.invertCondition).toBe(true);
      expect(substringFilter.type).toBe(FilterTypeEnum.ATTRIBUTE);
    });

  });

});
