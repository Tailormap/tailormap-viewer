import { FormFieldModel, FormOptionsModel } from '@tailormap-viewer/api';

export interface FormModel {
  id: number;
  name: string;
  featureSourceId: number;
  featureTypeName: string;
  options: FormOptionsModel;
  fields: FormFieldModel[];
}
