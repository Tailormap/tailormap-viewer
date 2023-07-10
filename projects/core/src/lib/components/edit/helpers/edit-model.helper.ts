import {
  AttributeModel, AttributeType, ColumnMetadataModel, FeatureModel, LayerDetailsModel,
} from '@tailormap-viewer/api';
import { FormFieldModel } from '../models/form-field.model';

export class EditModelHelper {

  private static geometryTypes: Set<AttributeType> = new Set([
    AttributeType.GEOMETRY,
    AttributeType.LINESTRING,
    AttributeType.MULTILINESTRING,
    AttributeType.POINT,
    AttributeType.MULTIPOINT,
    AttributeType.LINESTRING,
    AttributeType.MULTILINESTRING,
  ]);

  public static createEditModel(
    feature: FeatureModel,
    layerDetails: LayerDetailsModel,
    columnMetadata: ColumnMetadataModel[],
  ): FormFieldModel[] {
    if (!layerDetails.editable) {
      return [];
    }
    return layerDetails.attributes
      .filter(attribute => !EditModelHelper.isGeometryAttribute(attribute))
      .map<FormFieldModel>(attribute => {
      const attributeValue = feature.attributes[attribute.key];
      const metadata = columnMetadata.find(c => c.key === attribute.key);
      return {
        label: attribute.editAlias || metadata?.alias || attribute.key,
        value: attributeValue || attribute.defaultValue || '',
        name: attribute.key,
        required: attribute.nullable === false,
        disabled: !attribute.editable,
        type: EditModelHelper.getFormFieldType(attribute),
        valueList: attribute.valueList?.split(',').map(val => {
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
      case AttributeType.NUMBER:
      case AttributeType.DOUBLE:
        return 'number';
      case AttributeType.STRING:
        return 'text';
      default:
        return 'text';
    }
  }

  private static isGeometryAttribute(attribute: AttributeModel) {
    return EditModelHelper.geometryTypes.has(attribute.type);
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
