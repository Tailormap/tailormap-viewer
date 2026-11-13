import { AttributeType, FormFieldTypeEnum } from '../models';

/**
 * Rules for which edit form field types can be used for which attribute types. Used by the admin to offer field types
 * when configuring a form and by the viewer to ignore a configured field type that does not fit the attribute.
 */
export class FormFieldTypeHelper {

  private static ALLOWED_ATTRIBUTE_TYPES: Record<FormFieldTypeEnum, AttributeType[]> = {
    [FormFieldTypeEnum.TEXT]: [AttributeType.STRING],
    [FormFieldTypeEnum.NUMBER]: [ AttributeType.STRING, AttributeType.NUMBER, AttributeType.DOUBLE ],
    [FormFieldTypeEnum.SELECT]: [
      AttributeType.STRING,
      AttributeType.NUMBER,
      AttributeType.DOUBLE,
      AttributeType.INTEGER,
      AttributeType.BOOLEAN,
      AttributeType.DATE,
    ],
    [FormFieldTypeEnum.TEXTAREA]: [AttributeType.STRING],
    [FormFieldTypeEnum.INTEGER]: [ AttributeType.STRING, AttributeType.NUMBER, AttributeType.DOUBLE, AttributeType.INTEGER ],
    [FormFieldTypeEnum.BOOLEAN]: [AttributeType.BOOLEAN],
    [FormFieldTypeEnum.DATE]: [ AttributeType.STRING, AttributeType.DATE ],
    [FormFieldTypeEnum.TIMESTAMP]: [ AttributeType.STRING, AttributeType.TIMESTAMP ],
  };

  public static getAllowedAttributeTypes(fieldType: FormFieldTypeEnum): AttributeType[] {
    return FormFieldTypeHelper.ALLOWED_ATTRIBUTE_TYPES[fieldType] || [];
  }

  public static isAllowedForAttributeType(fieldType: FormFieldTypeEnum, attributeType: AttributeType): boolean {
    return FormFieldTypeHelper.getAllowedAttributeTypes(fieldType).includes(attributeType);
  }

  /**
   * The form field type to use for an attribute when no (compatible) type is configured. A configured value list on the
   * attribute always results in a choice list.
   */
  public static getDefaultFormFieldType(attributeType: AttributeType, hasValueList?: boolean): FormFieldTypeEnum {
    if (hasValueList) {
      return FormFieldTypeEnum.SELECT;
    }
    switch (attributeType) {
      case AttributeType.BOOLEAN:
        return FormFieldTypeEnum.BOOLEAN;
      case AttributeType.DATE:
        return FormFieldTypeEnum.DATE;
      case AttributeType.TIMESTAMP:
        return FormFieldTypeEnum.TIMESTAMP;
      case AttributeType.INTEGER:
        return FormFieldTypeEnum.INTEGER;
      case AttributeType.NUMBER:
      case AttributeType.DOUBLE:
        return FormFieldTypeEnum.NUMBER;
      default:
        return FormFieldTypeEnum.TEXT;
    }
  }

}
