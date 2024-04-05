import { FormFieldTypeEnum } from './form-field-type.enum';
import { FormFieldValueListItemModel } from './form-field-value-list-item.model';

export interface FormFieldModel {
  name: string;
  label: string;
  type: FormFieldTypeEnum;
  tab?: string;
  column?: string;
  uniqueValuesAsOptions?: boolean;
  valueList?: FormFieldValueListItemModel[];
  allowValueListOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}
