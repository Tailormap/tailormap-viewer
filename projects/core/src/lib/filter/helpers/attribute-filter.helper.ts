import { FilterConditionEnum } from '../models/filter-condition.enum';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { AttributeFilterTypeModel } from '../models/attribute-filter-type.model';

export class AttributeFilterHelper {

  public static getConditionTypes(includeUniqueValues: boolean = false): AttributeFilterTypeModel[] {
    const types: AttributeFilterTypeModel[] = [
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
        label: $localize `Small than`,
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
        label: $localize `Small than or equal to`,
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
        attributeType: [FeatureAttributeTypeEnum.DATE],
      },
      {
        condition: FilterConditionEnum.DATE_AFTER_KEY,
        label: $localize `After`,
        readableLabel: $localize `is after`,
        attributeType: [FeatureAttributeTypeEnum.DATE],
      },
      {
        condition: FilterConditionEnum.DATE_BEFORE_KEY,
        label: $localize `Before`,
        readableLabel: $localize `is before`,
        attributeType: [FeatureAttributeTypeEnum.DATE],
      },
      {
        condition: FilterConditionEnum.DATE_BETWEEN_KEY,
        label: $localize `Between`,
        readableLabel: $localize `is between`,
        attributeType: [FeatureAttributeTypeEnum.DATE],
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

}
