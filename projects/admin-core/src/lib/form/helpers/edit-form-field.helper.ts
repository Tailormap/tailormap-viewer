import { AttributeType, FormFieldModel, FormFieldTypeEnum, FormFieldTypeHelper } from '@tailormap-viewer/api';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';

export class EditFormFieldHelper {

  public static fieldTypes = [
    {
      label: $localize `:@@admin-core.form.field-type-text:Text field`,
      value: FormFieldTypeEnum.TEXT,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.TEXT),
    },
    {
      label: $localize `:@@admin-core.form.field-type-number:Number field`,
      value: FormFieldTypeEnum.NUMBER,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.NUMBER),
    },
    {
      label: $localize `:@@admin-core.form.field-type-select:Choice list`,
      value: FormFieldTypeEnum.SELECT,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.SELECT),
    },
    {
      label: $localize `:@@admin-core.form.field-type-textarea:Textarea field`,
      value: FormFieldTypeEnum.TEXTAREA,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.TEXTAREA),
    },
    {
      label: $localize `:@@admin-core.form.field-type-integer:Integer field`,
      value: FormFieldTypeEnum.INTEGER,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.INTEGER),
    },
    {
      label: $localize `:@@admin-core.form.field-type-boolean:Checkbox field`,
      value: FormFieldTypeEnum.BOOLEAN,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.BOOLEAN),
    },
    {
      label: $localize `:@@admin-core.form.field-type-date:Date field`,
      value: FormFieldTypeEnum.DATE,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.DATE),
    },
    {
      label: $localize `:@@admin-core.form.field-type-timestamp:Timestamp field`,
      value: FormFieldTypeEnum.TIMESTAMP,
      allowedForAttributeTypes: FormFieldTypeHelper.getAllowedAttributeTypes(FormFieldTypeEnum.TIMESTAMP),
    },
  ];

  public static getFormFieldType(fieldType?: string) {
    if (fieldType === 'number') {
      return FormFieldTypeEnum.NUMBER;
    }
    if (fieldType === 'integer') {
      return FormFieldTypeEnum.INTEGER;
    }
    if (fieldType === 'boolean') {
      return FormFieldTypeEnum.BOOLEAN;
    }
    if (fieldType === 'select') {
      return FormFieldTypeEnum.SELECT;
    }
    if (fieldType === 'textarea') {
      return FormFieldTypeEnum.TEXTAREA;
    }
    if (fieldType === 'date') {
      return FormFieldTypeEnum.DATE;
    }
    if (fieldType === 'timestamp') {
      return FormFieldTypeEnum.TIMESTAMP;
    }
    return FormFieldTypeEnum.TEXT;
  }

  /** The field type for a newly added form field, based on the attribute type. */
  public static getDefaultFieldType(attribute?: Pick<AttributeDescriptorModel, 'type'> | null): FormFieldTypeEnum {
    return attribute ? FormFieldTypeHelper.getDefaultFormFieldType(attribute.type) : FormFieldTypeEnum.TEXT;
  }

  /**
   * Replaces the type of fields which is not compatible with the type of their attribute by the default type for the attribute.
   * This happens for fields added before field types defaulted to the attribute type, or when the attribute type changed after
   * refreshing the feature source. Fields for attributes which no longer exist are left alone.
   * @returns the corrected fields, or null when no field needed correcting
   */
  public static correctFieldTypes(
    fields: FormFieldModel[],
    attributes: Array<{ name: string; type: AttributeType }>,
  ): FormFieldModel[] | null {
    const attributeTypes = new Map(attributes.map(a => [ a.name, a.type ]));
    let corrected = false;
    const correctedFields = fields.map(field => {
      const attributeType = attributeTypes.get(field.name);
      if (!attributeType || FormFieldTypeHelper.isAllowedForAttributeType(field.type, attributeType)) {
        return field;
      }
      corrected = true;
      return { ...field, type: FormFieldTypeHelper.getDefaultFormFieldType(attributeType) };
    });
    return corrected ? correctedFields : null;
  }

  public static getFilteredFieldTypes(fieldName?: string, featureType?: FeatureTypeModel | null) {
    if (!fieldName || !featureType) {
      return EditFormFieldHelper.fieldTypes;
    }
    const attribute = featureType?.attributes.find(a => a.name === fieldName);
    if (!attribute) {
      return EditFormFieldHelper.fieldTypes;
    }
    return EditFormFieldHelper.fieldTypes.filter(fieldType => {
      return fieldType.allowedForAttributeTypes.includes(attribute.type);
    });
  }

}
