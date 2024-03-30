import { FormFieldTypeEnum } from './form-field-type.enum';

export interface FormFieldModel {
  name: string;
  label: string;
  type: FormFieldTypeEnum;
  tab?: string;
  column?: string;
  uniqueValuesAsOptions?: boolean;
  valueList?: Array<{ value: string; label?: string }>;
  allowValueListOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}