import { AttributeType, FormFieldControlTypeEnum } from '../models';

/**
 * Rules for which edit form controls can be used for which attribute types. Used by the admin to offer controls
 * when configuring a form and by the viewer to ignore a configured control that does not fit the attribute.
 */
export class FormFieldControlTypeHelper {

  private static ALLOWED_ATTRIBUTE_TYPES: Record<FormFieldControlTypeEnum, AttributeType[]> = {
    [FormFieldControlTypeEnum.TEXT]: [AttributeType.STRING],
    [FormFieldControlTypeEnum.NUMBER]: [ AttributeType.STRING, AttributeType.NUMBER, AttributeType.DOUBLE, AttributeType.INTEGER ],
    [FormFieldControlTypeEnum.SELECT]: [
      AttributeType.STRING,
      AttributeType.NUMBER,
      AttributeType.DOUBLE,
      AttributeType.INTEGER,
      AttributeType.BOOLEAN,
      AttributeType.DATE,
    ],
    [FormFieldControlTypeEnum.TEXTAREA]: [AttributeType.STRING],
    [FormFieldControlTypeEnum.CHECKBOX]: [AttributeType.BOOLEAN],
    [FormFieldControlTypeEnum.DATE]: [ AttributeType.STRING, AttributeType.DATE ],
    [FormFieldControlTypeEnum.DATETIME]: [ AttributeType.STRING, AttributeType.TIMESTAMP ],
  };

  public static getAllowedAttributeTypes(controlType: FormFieldControlTypeEnum): AttributeType[] {
    return FormFieldControlTypeHelper.ALLOWED_ATTRIBUTE_TYPES[controlType] || [];
  }

  public static isAllowedForAttributeType(controlType: FormFieldControlTypeEnum, attributeType: AttributeType): boolean {
    return FormFieldControlTypeHelper.getAllowedAttributeTypes(controlType).includes(attributeType);
  }

  /**
   * The edit control to use for an attribute when no (compatible) type is configured. A configured value list on the
   * attribute always results in a choice list.
   */
  public static getDefaultControlType(attributeType: AttributeType, hasValueList?: boolean): FormFieldControlTypeEnum {
    if (hasValueList) {
      return FormFieldControlTypeEnum.SELECT;
    }
    switch (attributeType) {
      case AttributeType.BOOLEAN:
        return FormFieldControlTypeEnum.CHECKBOX;
      case AttributeType.DATE:
        return FormFieldControlTypeEnum.DATE;
      case AttributeType.TIMESTAMP:
        return FormFieldControlTypeEnum.DATETIME;
      case AttributeType.INTEGER:
      case AttributeType.NUMBER:
      case AttributeType.DOUBLE:
        return FormFieldControlTypeEnum.NUMBER;
      default:
        return FormFieldControlTypeEnum.TEXT;
    }
  }

}
