import { AttributeType, FormFieldTypeEnum } from '@tailormap-viewer/api';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';

export class EditFormFieldHelper {

  public static fieldTypes = [
    {
      label: $localize `:@@admin-core.form.field-type-text:Text field`,
      value: FormFieldTypeEnum.TEXT,
      allowedForAttributeTypes: [
        AttributeType.STRING,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-number:Number field`,
      value: FormFieldTypeEnum.NUMBER,
      allowedForAttributeTypes: [
        AttributeType.STRING,
        AttributeType.NUMBER,
        AttributeType.DOUBLE,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-select:Choice list`,
      value: FormFieldTypeEnum.SELECT,
      allowedForAttributeTypes: [
        AttributeType.STRING,
        AttributeType.NUMBER,
        AttributeType.DOUBLE,
        AttributeType.BOOLEAN,
        AttributeType.DATE,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-textarea:Textarea field`,
      value: FormFieldTypeEnum.TEXTAREA,
      allowedForAttributeTypes: [
        AttributeType.STRING,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-integer:Integer field`,
      value: FormFieldTypeEnum.INTEGER,
      allowedForAttributeTypes: [
        AttributeType.STRING,
        AttributeType.NUMBER,
        AttributeType.DOUBLE,
        AttributeType.INTEGER,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-boolean:Checkbox field`,
      value: FormFieldTypeEnum.BOOLEAN,
      allowedForAttributeTypes: [
        AttributeType.BOOLEAN,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-date:Date field`,
      value: FormFieldTypeEnum.DATE,
      allowedForAttributeTypes: [
        AttributeType.STRING,
        AttributeType.DATE,
      ],
    },
    {
      label: $localize `:@@admin-core.form.field-type-timestamp:Timestamp field`,
      value: FormFieldTypeEnum.TIMESTAMP,
      allowedForAttributeTypes: [
        AttributeType.STRING,
        AttributeType.TIMESTAMP,
      ],
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
    return FormFieldTypeEnum.TEXT;
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
