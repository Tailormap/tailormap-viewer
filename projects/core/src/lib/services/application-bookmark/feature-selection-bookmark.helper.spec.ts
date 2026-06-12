import { FeatureSelectionBookmarkHelper } from './feature-selection-bookmark.helper';
import { FilterConditionEnum, FilterTypeEnum } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

describe('FeatureSelectionBookmarkHelper', () => {

  describe('getFragmentFromBookmark', () => {

    test('returns null for null input', () => {
      expect(FeatureSelectionBookmarkHelper.getFragmentFromBookmark(null)).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(FeatureSelectionBookmarkHelper.getFragmentFromBookmark('')).toBeNull();
    });

    test('returns null when attribute is missing', () => {
      expect(FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;value=abc')).toBeNull();
    });

    test('returns null when value is missing', () => {
      expect(FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;attribute=myAttr')).toBeNull();
    });

    test('returns null when layers is missing', () => {
      expect(FeatureSelectionBookmarkHelper.getFragmentFromBookmark('attribute=myAttr;value=abc')).toBeNull();
    });

    test('parses a valid bookmark string', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;attribute=myAttr;value=abc');
      expect(result).toEqual({
        layers: [{ serviceId: 'service1', layerName: 'layer1' }],
        attributeName: 'myAttr',
        attributeValue: 'abc',
        createFilter: false,
      });
    });

    test('parses createFilter=true', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;attribute=myAttr;value=abc;filter=true');
      expect(result?.createFilter).toBe(true);
    });

    test('parses createFilter=false', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;attribute=myAttr;value=abc;filter=false');
      expect(result?.createFilter).toBe(false);
    });

    test('parses other value for createFilter as false', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;attribute=myAttr;value=abc;filter=other');
      expect(result?.createFilter).toBe(false);
    });

    test('parses multiple layers', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1,service2/layer2;attribute=myAttr;value=abc');
      expect(result?.layers).toEqual([
        { serviceId: 'service1', layerName: 'layer1' },
        { serviceId: 'service2', layerName: 'layer2' },
      ]);
    });

    test('ignores layer pairs without separator', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1,invalidlayer;attribute=myAttr;value=abc');
      expect(result?.layers).toEqual([
        { serviceId: 'service1', layerName: 'layer1' },
      ]);
    });

    test('ignores empty layer entries', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1,  ,service2/layer2;attribute=myAttr;value=abc');
      expect(result?.layers).toEqual([
        { serviceId: 'service1', layerName: 'layer1' },
        { serviceId: 'service2', layerName: 'layer2' },
      ]);
    });

    test('returns null for incorrect part identifiers', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/layer1;notattribute=myAttr;value=abc');
      expect(result).toBeNull();
    });

    test('returns correct fragment with special characters in values', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1/laye%r1;attribute=myA=ttr;value=ab/+c');
      expect(result).toEqual({
        layers: [{ serviceId: 'service1', layerName: 'laye%r1' }],
        attributeName: 'myA=ttr',
        attributeValue: 'ab/+c',
        createFilter: false,
      });
    });

    test('ignores incorrect layer pairs', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark(
        'layers=service1/layer1,service2/lay/er2,service3layer3;attribute=myAttr;value=abc',
      );
      expect(result?.layers).toEqual([{ serviceId: 'service1', layerName: 'layer1' }]);
    });

    test('should return null when no correct layers are provided', () => {
      const result = FeatureSelectionBookmarkHelper.getFragmentFromBookmark('layers=service1layer1;attribute=myAttr;value=abc');
      expect(result).toBeNull();
    });

  });

  describe('createFilterGroup', () => {

    test('returns error when appLayerIds is empty', () => {
      const result = FeatureSelectionBookmarkHelper.createFilterGroup([], 'myAttr', 'myValue');
      expect('errorMessage' in result).toBe(true);
    });

    test('returns error when attributeName is empty', () => {
      const result = FeatureSelectionBookmarkHelper.createFilterGroup(['layer1'], '', 'myValue');
      expect('errorMessage' in result).toBe(true);
    });

    test('returns error when attributeValue is empty', () => {
      const result = FeatureSelectionBookmarkHelper.createFilterGroup(['layer1'], 'myAttr', '');
      expect('errorMessage' in result).toBe(true);
    });

    test('returns a valid filter group for valid inputs', () => {
      const result = FeatureSelectionBookmarkHelper.createFilterGroup([ 'layer1', 'layer2' ], 'myAttr', 'myValue');
      expect('errorMessage' in result).toBe(false);
      if ('errorMessage' in result) { return; }

      expect(result.source).toBe('FeatureSelectionBookmark');
      expect(result.layerIds).toEqual([ 'layer1', 'layer2' ]);
      expect(result.type).toBe(FilterTypeEnum.ATTRIBUTE);
      expect(result.filters).toHaveLength(1);
      expect(AttributeFilterHelper.isValidFilter(result.filters[0])).toBe(true);
      expect(result.filters[0].condition).toBe(FilterConditionEnum.STRING_EQUALS_KEY);
    });

  });

});
