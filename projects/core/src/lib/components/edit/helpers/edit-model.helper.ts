import {
  AttributeModel, AttributeType, AttributeTypeHelper, ColumnMetadataModel, FeatureModel, FormFieldModel, FormFieldTypeEnum,
  FormFieldTypeHelper, LayerDetailsModel,
} from '@tailormap-viewer/api';
import { ViewerEditFormFieldModel } from '../models/viewer-edit-form-field.model';
import { ArrayHelper } from '@tailormap-viewer/shared';

export class EditModelHelper {

  public static createEditModel(
    feature: FeatureModel,
    layerDetails: LayerDetailsModel,
    columnMetadata: ColumnMetadataModel[],
    isNewFeature?: boolean,
  ): ViewerEditFormFieldModel[] {
    if (!layerDetails.editable) {
      return [];
    }
    const formFields: Map<string, FormFieldModel> | null = layerDetails.form
      ? new Map(layerDetails.form.fields.map(f => [ f.name, f ]))
      : null;
    const orderedFormFields = layerDetails.form ? layerDetails.form.fields.map(f => f.name) : [];
    const attributes = formFields
      ? layerDetails.attributes
        .filter(a => formFields.has(a.name))
        .sort(ArrayHelper.getArraySorter('name', orderedFormFields))
      : [...layerDetails.attributes];
    return attributes
      .filter(attribute => !AttributeTypeHelper.isGeometryType(attribute.type))
      .map<ViewerEditFormFieldModel>(attribute => {
        const attributeValue = feature.attributes[attribute.name];
        const fieldValue = isNewFeature ? attributeValue || attribute.defaultValue || '' : attributeValue;
        const metadata = columnMetadata.find(c => c.name === attribute.name);
        const attributeField = EditModelHelper.createAttributeField(attribute, fieldValue, metadata?.alias);
        const formField = formFields?.get(attribute.name);
        return formField
          ? EditModelHelper.applyFormField(attributeField, formField, attribute)
          : attributeField;
    });
  }

  /**
   * Creates the edit field from the attribute metadata of the layer only. The attribute metadata includes the catalog and
   * application layer settings (such as read-only attributes) and the database column constraints.
   */
  private static createAttributeField(
    attribute: AttributeModel,
    value: ViewerEditFormFieldModel['value'],
    alias?: string,
  ): ViewerEditFormFieldModel {
    // Do not display a required boolean as a checkbox but as a select, because a checkbox can't show whether it is null or false so
    // a user must touch it to make the form valid. For nullable booleans just keep the checkbox and do not bother the user with the
    // difference between a null and a false boolean.
    const booleanValueList = (attribute.type === AttributeType.BOOLEAN && !attribute.nullable)  ?
      [{ value: true, label: $localize `:@@core.edit.true:True` }, { value: false, label: $localize `:@@core.edit.false:False` }] : null;
    return {
      label: attribute.editAlias || alias || attribute.name,
      value,
      name: attribute.name,
      required: attribute.nullable === false,
      disabled: !attribute.editable,
      type: booleanValueList ? FormFieldTypeEnum.SELECT : FormFieldTypeHelper.getDefaultFormFieldType(attribute.type, !!attribute.valueList),
      valueList: booleanValueList ? booleanValueList : attribute.valueList?.split(',').map(val => {
        const listValue = val.trim();
        return { value: listValue, label: listValue };
      }),
    };
  }

  /**
   * Applies the configuration of a form field on top of the field created from the attribute. The form determines the presentation
   * (label, tab, hint, value list etc.), but cannot make an attribute editable or optional when the attribute metadata says otherwise.
   * A configured field type which is not compatible with the attribute type (for example a text field for a date attribute, which
   * is the default when adding a field in the admin) is ignored in favour of the type derived from the attribute.
   */
  private static applyFormField(
    attributeField: ViewerEditFormFieldModel,
    formField: FormFieldModel,
    attribute: AttributeModel,
  ): ViewerEditFormFieldModel {
    const useFormFieldType = FormFieldTypeHelper.isAllowedForAttributeType(formField.type, attribute.type);
    return {
      ...formField,
      value: attributeField.value,
      type: useFormFieldType ? formField.type : attributeField.type,
      valueList: useFormFieldType ? EditModelHelper.parseValueList(attribute.type, formField.valueList) : attributeField.valueList,
      disabled: !!formField.disabled || !!attributeField.disabled,
      required: !!formField.required || !!attributeField.required,
    };
  }

  /**
   * Parses the value list of a form field to values of the attribute type. Items with a value which can't be parsed to the
   * attribute type are left out. This happens when the attribute type changed after the form was configured.
   */
  private static parseValueList(
    type: AttributeType,
    valueList?: Array<{ value: string | number | boolean; label?: string }>,
  ): Array<{ value: string | number | boolean; label: string }> | undefined {
    if (!valueList) {
      return undefined;
    }
    return valueList
      .map(item => {
        const value = EditModelHelper.parseValue(type, item.value);
        return value === null ? null : { value, label: item.label || `${item.value}` };
      })
      .filter((item): item is { value: string | number | boolean; label: string } => item !== null);
  }

  private static parseValue(type: AttributeType, value: string | number | boolean): string | number | boolean | null {
    if (typeof value !== 'string') {
      return value;
    }
    if (type === AttributeType.BOOLEAN) {
      return value === 'true' ? true : value === 'false' ? false : null;
    }
    if (AttributeTypeHelper.isNumericType(type)) {
      const numberValue = value.trim() === '' ? NaN : +value;
      return isNaN(numberValue) ? null : numberValue;
    }
    return value;
  }
}
