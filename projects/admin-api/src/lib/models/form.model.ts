import { FormOptionsModel } from './form-options.model';
import { FormFieldModel } from './form-field.model';

export interface FormModel {
  id: number;
  name: string;
  featureSourceId: number;
  featureTypeName: string;
  options: FormOptionsModel;
  fields: FormFieldModel[];
}
