import { FormFieldModel } from '@tailormap-viewer/api';

export interface ViewerEditFormFieldModel extends FormFieldModel {
  value: string | boolean | number | undefined;
}
