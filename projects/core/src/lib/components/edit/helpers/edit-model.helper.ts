import {
  AttributeModel, AttributeType, AttributeTypeHelper, ChoiceListModel, ChoiceListSourceEnum, ChoiceListValueModel, ColumnMetadataModel, FeatureModel, FormFieldModel,
  FormFieldControlTypeEnum, FormFieldControlTypeHelper, LayerDetailsModel,
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
    const booleanChoiceList: ChoiceListModel | undefined = (attribute.type === AttributeType.BOOLEAN && !attribute.nullable) ? {
      source: ChoiceListSourceEnum.LIST,
      values: [{ value: true, label: $localize `:@@core.edit.true:True` }, { value: false, label: $localize `:@@core.edit.false:False` }],
    } : undefined;
    return {
      label: attribute.editAlias || alias || attribute.name,
      value,
      name: attribute.name,
      attributeType: attribute.type,
      required: attribute.nullable === false,
      readOnly: !attribute.editable,
      controlType: booleanChoiceList ? FormFieldControlTypeEnum.SELECT : FormFieldControlTypeHelper.getDefaultControlType(attribute.type),
      choiceList: booleanChoiceList,
    };
  }

  /**
   * Applies the configuration of a form field on top of the field created from the attribute. The form determines the presentation
   * (label, tab, hint, choice list etc.), but cannot make an attribute editable or optional when the attribute metadata says otherwise.
   * A configured control which is not compatible with the attribute type (for example a text field for a date attribute, which
   * is the default when adding a field in the admin) is ignored in favour of the control derived from the attribute.
   */
  private static applyFormField(
    attributeField: ViewerEditFormFieldModel,
    formField: FormFieldModel,
    attribute: AttributeModel,
  ): ViewerEditFormFieldModel {
    const useFormFieldControlType = FormFieldControlTypeHelper.isAllowedForAttributeType(formField.controlType, attribute.type);
    return {
      ...formField,
      value: attributeField.value,
      attributeType: attributeField.attributeType,
      controlType: useFormFieldControlType ? formField.controlType : attributeField.controlType,
      choiceList: useFormFieldControlType ? EditModelHelper.parseChoiceList(attribute.type, formField.choiceList) : attributeField.choiceList,
      readOnly: !!formField.readOnly || !!attributeField.readOnly,
      required: !!formField.required || !!attributeField.required,
    };
  }

  /**
   * Parses the configured values of the choice list of a form field to values of the attribute type. Values which can't be parsed
   * to the attribute type are left out. This happens when the attribute type changed after the form was configured.
   */
  private static parseChoiceList(type: AttributeType, choiceList?: ChoiceListModel): ChoiceListModel | undefined {
    if (!choiceList) {
      return undefined;
    }
    const values = (choiceList.values || []).flatMap<ChoiceListValueModel>(item => {
      const value = EditModelHelper.parseValue(type, item.value);
      return value === null ? [] : [{ value, label: item.label || `${item.value}` }];
    });
    return { ...choiceList, values };
  }

  private static parseValue(type: AttributeType, value: ChoiceListValueModel['value']): ChoiceListValueModel['value'] | null {
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
