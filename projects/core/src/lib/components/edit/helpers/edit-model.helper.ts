import {
  AttributeModel, AttributeType, AttributeTypeHelper, ColumnMetadataModel, FeatureModel, FormFieldModel, FormFieldTypeEnum,
  LayerDetailsModel,
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
        const formField = formFields?.get(attribute.name);
        const fieldValue = isNewFeature ? attributeValue || attribute.defaultValue || '' : attributeValue;
        if (formField) {
          return {
            ...formField,
            valueList: EditModelHelper.parseValueList(attribute.type, formField.valueList),
            value: fieldValue,
          };
        }
        const metadata = columnMetadata.find(c => c.name === attribute.name);
        // Do not display a required boolean as a checkbox but as a select, because a checkbox can't show whether it is null or false so
        // a user must touch it to make the form valid. For nullable booleans just keep the checkbox and do not bother the user with the
        // difference between a null and a false boolean.
        const booleanValueList = (attribute.type === AttributeType.BOOLEAN && !attribute.nullable)  ?
          [{ value: true, label: $localize `:@@core.edit.true:True` }, { value: false, label: $localize `:@@core.edit.false:False` }] : null;
        return {
          label: attribute.editAlias || metadata?.alias || attribute.name,
          value: fieldValue,
          name: attribute.name,
          required: attribute.nullable === false,
          disabled: !attribute.editable,
          type: booleanValueList ? FormFieldTypeEnum.SELECT : EditModelHelper.getFormFieldType(attribute),
          valueList: booleanValueList ? booleanValueList : attribute.valueList?.split(',').map(val => {
            const value = val.trim();
            return { value, label: value };
          }),
        };
    });
  }

  private static getFormFieldType(attribute: AttributeModel): FormFieldTypeEnum {
    if (attribute.valueList) {
      return FormFieldTypeEnum.SELECT;
    }
    switch (attribute.type) {
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
      case AttributeType.STRING:
        return FormFieldTypeEnum.TEXT;
      default:
        return FormFieldTypeEnum.TEXT;
    }
  }

  private static parseValueList(
    type: AttributeType,
    valueList?: Array<{ value: string | number | boolean; label?: string }>,
  ): Array<{ value: string | number | boolean; label: string }> | undefined {
    if (!valueList) {
      return undefined;
    }
    return valueList.map(item => {
      let value = item.value;
      const label = item.label || `${item.value}`;
      if (type === AttributeType.BOOLEAN && typeof value === 'string') {
        value = value === 'true';
      }
      if ((type === AttributeType.INTEGER || type === AttributeType.NUMBER) && typeof value === 'string') {
        value = +(value);
      }
      return { value: value, label };
    });
  }
}
