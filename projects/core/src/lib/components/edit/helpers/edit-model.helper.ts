import {
  AttributeModel, AttributeType, AttributeTypeHelper, ColumnMetadataModel, FeatureModel, LayerDetailsModel,
} from '@tailormap-viewer/api';
import { FormFieldModel } from '../models/form-field.model';

export class EditModelHelper {

  public static createEditModel(
    feature: FeatureModel,
    layerDetails: LayerDetailsModel,
    columnMetadata: ColumnMetadataModel[],
    isNewFeature?: boolean,
  ): FormFieldModel[] {
    if (!layerDetails.editable) {
      return [];
    }
    return layerDetails.attributes
      .filter(attribute => !AttributeTypeHelper.isGeometryType(attribute.type))
      .map<FormFieldModel>(attribute => {
      const attributeValue = feature.attributes[attribute.key];
      const metadata = columnMetadata.find(c => c.key === attribute.key);
      // Do not display a required boolean as a checkbox but as a select, because a checkbox can't show whether it is null or false so
      // a user must touch it to make the form valid. For nullable booleans just keep the checkbox and do not bother the user with the
      // difference between a null and a false boolean.
      const booleanValueList = (attribute.type === AttributeType.BOOLEAN && !attribute.nullable)  ?
        [{ value: true, label: $localize `True` }, { value: false, label: $localize `False` }] : null;
      return {
        label: attribute.editAlias || metadata?.alias || attribute.key,
        value: isNewFeature ? attributeValue || attribute.defaultValue || '' : attributeValue,
        name: attribute.key,
        required: attribute.nullable === false,
        disabled: !attribute.editable,
        type: booleanValueList ? 'select' : EditModelHelper.getFormFieldType(attribute),
        valueList: booleanValueList ? booleanValueList : attribute.valueList?.split(',').map(val => {
          const value = val.trim();
          return { value, label: value };
        }),
      };
    });
  }

  private static getFormFieldType(attribute: AttributeModel): FormFieldModel['type'] {
    if (attribute.valueList) {
      return 'select';
    }
    switch (attribute.type) {
      case AttributeType.BOOLEAN:
        return 'boolean';
      case AttributeType.DATE:
        return 'date';
      case AttributeType.TIMESTAMP:
        return 'text';
      case AttributeType.INTEGER:
        return 'integer';
      case AttributeType.NUMBER:
      case AttributeType.DOUBLE:
        return 'number';
      case AttributeType.STRING:
        return 'text';
      default:
        return 'text';
    }
  }

  public static updateFeature(currentFeature: FeatureModel, values: Record<string, number | string | boolean>): FeatureModel {
    const feature: FeatureModel = {
      ...currentFeature,
       attributes: {
        ...currentFeature.attributes,
       },
    };
    for (const [ key, value ] of Object.entries(values)) {
      feature.attributes[key] = value;
    }
    return feature;
  }
}
