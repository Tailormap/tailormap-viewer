import { AttributeType, FormFieldModel, FormFieldControlTypeEnum, FormFieldControlTypeHelper } from '@tailormap-viewer/api';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';

export class EditFormFieldHelper {

  public static controlTypes = [
    {
      label: $localize `:@@admin-core.form.field-type-text:Text field`,
      value: FormFieldControlTypeEnum.TEXT,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.TEXT),
    },
    {
      label: $localize `:@@admin-core.form.field-type-number:Number field`,
      value: FormFieldControlTypeEnum.NUMBER,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.NUMBER),
    },
    {
      label: $localize `:@@admin-core.form.field-type-select:Choice list`,
      value: FormFieldControlTypeEnum.SELECT,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.SELECT),
    },
    {
      label: $localize `:@@admin-core.form.field-type-textarea:Textarea field`,
      value: FormFieldControlTypeEnum.TEXTAREA,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.TEXTAREA),
    },
    {
      label: $localize `:@@admin-core.form.field-type-checkbox:Checkbox`,
      value: FormFieldControlTypeEnum.CHECKBOX,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.CHECKBOX),
    },
    {
      label: $localize `:@@admin-core.form.field-type-date:Date field`,
      value: FormFieldControlTypeEnum.DATE,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.DATE),
    },
    {
      label: $localize `:@@admin-core.form.field-type-datetime:Date and time field`,
      value: FormFieldControlTypeEnum.DATETIME,
      allowedForAttributeTypes: FormFieldControlTypeHelper.getAllowedAttributeTypes(FormFieldControlTypeEnum.DATETIME),
    },
  ];

  public static getControlType(controlType?: string): FormFieldControlTypeEnum {
    return Object.values(FormFieldControlTypeEnum).find(value => value === controlType) ?? FormFieldControlTypeEnum.TEXT;
  }

  /** The edit control for a newly added form field, based on the attribute type. */
  public static getDefaultControlType(attribute?: Pick<AttributeDescriptorModel, 'type'> | null): FormFieldControlTypeEnum {
    return attribute ? FormFieldControlTypeHelper.getDefaultControlType(attribute.type) : FormFieldControlTypeEnum.TEXT;
  }

  /**
   * Replaces the control of fields which is not compatible with the type of their attribute by the default control for the attribute.
   * This happens for fields added before field controls defaulted to one based on the attribute type, or when the attribute type changed after
   * refreshing the feature source. Fields for attributes which no longer exist are left alone.
   * @returns the corrected fields, or null when no field needed correcting
   */
  public static correctControlTypes(
    fields: FormFieldModel[],
    attributes: Array<{ name: string; type: AttributeType }>,
  ): FormFieldModel[] | null {
    const attributeTypes = new Map(attributes.map(a => [ a.name, a.type ]));
    let corrected = false;
    const correctedFields = fields.map(field => {
      const attributeType = attributeTypes.get(field.name);
      if (!attributeType || FormFieldControlTypeHelper.isAllowedForAttributeType(field.controlType, attributeType)) {
        return field;
      }
      corrected = true;
      return { ...field, controlType: FormFieldControlTypeHelper.getDefaultControlType(attributeType) };
    });
    return corrected ? correctedFields : null;
  }

  public static getFilteredControlTypes(fieldName?: string, featureType?: FeatureTypeModel | null) {
    if (!fieldName || !featureType) {
      return EditFormFieldHelper.controlTypes;
    }
    const attribute = featureType?.attributes.find(a => a.name === fieldName);
    if (!attribute) {
      return EditFormFieldHelper.controlTypes;
    }
    return EditFormFieldHelper.controlTypes.filter(controlType => {
      return controlType.allowedForAttributeTypes.includes(attribute.type);
    });
  }

}
