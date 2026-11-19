import { AttributeType, FormFieldModel } from '@tailormap-viewer/api';

export interface ViewerEditFormFieldModel extends FormFieldModel {
  value: string | boolean | number | undefined;
  /** The type of the attribute, for validation which depends on it (for example a whole number for an integer attribute). */
  attributeType: AttributeType;
}
