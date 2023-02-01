import { FilterConditionEnum } from '../models/filter-condition.enum';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionModel } from '../models/filter-condition.model';
import { AttributeFilterModel } from '../models/attribute-filter.model';

export class AttributeFilterHelper {

  private static filtersRequiringAtLeastOneValue = new Set([
    FilterConditionEnum.NUMBER_EQUALS_KEY,
    FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
    FilterConditionEnum.NUMBER_SMALLER_THAN_KEY,
    FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY,
    FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY,
    FilterConditionEnum.STRING_EQUALS_KEY,
    FilterConditionEnum.STRING_LIKE_KEY,
    FilterConditionEnum.STRING_STARTS_WITH_KEY,
    FilterConditionEnum.STRING_ENDS_WITH_KEY,
    FilterConditionEnum.DATE_ON_KEY,
    FilterConditionEnum.DATE_AFTER_KEY,
    FilterConditionEnum.DATE_BEFORE_KEY,
    FilterConditionEnum.UNIQUE_VALUES_KEY,
  ]);

  private static filtersRequiringTwoValues = new Set([
    FilterConditionEnum.NUMBER_BETWEEN_KEY,
    FilterConditionEnum.DATE_BETWEEN_KEY,
  ]);

  public static getConditionTypes(includeUniqueValues: boolean = false): FilterConditionModel[] {
    const types: FilterConditionModel[] = [
      {
        condition: FilterConditionEnum.NUMBER_EQUALS_KEY,
        label: $localize `Equals`,
        readableLabel: $localize `equals to`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.NUMBER_LARGER_THAN_KEY,
        label: $localize `Greater than`,
        readableLabel: $localize `is greater than`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.NUMBER_SMALLER_THAN_KEY,
        label: $localize `Smaller than`,
        readableLabel: $localize `is smaller than`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.NUMBER_LARGER_EQUALS_THAN_KEY,
        label: $localize `Greater than or equal to`,
        readableLabel: $localize `is greater than or equal to`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.NUMBER_SMALLER_EQUALS_THAN_KEY,
        label: $localize `Smaller than or equal to`,
        readableLabel: $localize `is smaller than or equal to`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.NUMBER_BETWEEN_KEY,
        label: $localize `Between`,
        readableLabel: $localize `is between`,
        attributeType: [ FeatureAttributeTypeEnum.INTEGER, FeatureAttributeTypeEnum.DOUBLE ],
      },
      {
        condition: FilterConditionEnum.STRING_EQUALS_KEY,
        label: $localize `Equals`,
        readableLabel: $localize `equals to`,
        attributeType: [FeatureAttributeTypeEnum.STRING],
      },
      {
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        label: $localize `Contains`,
        readableLabel: $localize `contains`,
        attributeType: [FeatureAttributeTypeEnum.STRING],
      },
      {
        condition: FilterConditionEnum.STRING_STARTS_WITH_KEY,
        label: $localize `Starts with`,
        readableLabel: $localize `starts with`,
        attributeType: [FeatureAttributeTypeEnum.STRING],
      },
      {
        condition: FilterConditionEnum.STRING_ENDS_WITH_KEY,
        label: $localize `Ends with`,
        readableLabel: $localize `ends with`,
        attributeType: [FeatureAttributeTypeEnum.STRING],
      },
      {
        condition: FilterConditionEnum.DATE_ON_KEY,
        label: $localize `On`,
        readableLabel: $localize `is on`,
        attributeType: [ FeatureAttributeTypeEnum.DATE, FeatureAttributeTypeEnum.TIMESTAMP ],
      },
      {
        condition: FilterConditionEnum.DATE_AFTER_KEY,
        label: $localize `After`,
        readableLabel: $localize `is after`,
        attributeType: [ FeatureAttributeTypeEnum.DATE, FeatureAttributeTypeEnum.TIMESTAMP ],
      },
      {
        condition: FilterConditionEnum.DATE_BEFORE_KEY,
        label: $localize `Before`,
        readableLabel: $localize `is before`,
        attributeType: [ FeatureAttributeTypeEnum.DATE, FeatureAttributeTypeEnum.TIMESTAMP ],
      },
      {
        condition: FilterConditionEnum.DATE_BETWEEN_KEY,
        label: $localize `Between`,
        readableLabel: $localize `is between`,
        attributeType: [ FeatureAttributeTypeEnum.DATE, FeatureAttributeTypeEnum.TIMESTAMP ],
      },
      {
        condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
        label: $localize `Is true`,
        readableLabel: $localize `is true`,
        attributeType: [FeatureAttributeTypeEnum.BOOLEAN],
      },
      {
        condition: FilterConditionEnum.BOOLEAN_FALSE_KEY,
        label: $localize `Is false`,
        readableLabel: $localize `is false`,
        attributeType: [FeatureAttributeTypeEnum.BOOLEAN],
      },
      {
        condition: FilterConditionEnum.NULL_KEY,
        label: $localize `Is null`,
        readableLabel: $localize `is null`,
        attributeType: [],
      },
    ];
    if (includeUniqueValues) {
      types.push({
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        label: $localize `Choose values`,
        readableLabel: $localize `contains one of the values`,
        attributeType: [],
      });
    }
    return types;
  }

  public static isValidFilter(filter: Partial<AttributeFilterModel> | null): filter is AttributeFilterModel {
    if (!filter || !filter.condition || !filter.attribute || !filter.attributeType) {
      return false;
    }
    if (AttributeFilterHelper.filtersRequiringTwoValues.has(filter.condition)) {
      return AttributeFilterHelper.isValidValues(filter.value, 2);
    }
    if (AttributeFilterHelper.filtersRequiringAtLeastOneValue.has(filter.condition)) {
      return AttributeFilterHelper.isValidValues(filter.value, 1);
    }
    return true;
  }

  private static isValidValues(values: string[] | undefined, minLength: number) {
    if (!values || values.length < minLength) {
      return false;
    }
    return values.every(v => {
      return typeof v !== 'undefined' && v !== null && v !== '';
    });
  }

}
