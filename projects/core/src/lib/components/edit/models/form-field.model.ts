export interface FormFieldModel {
  name: string;
  label: string;
  type: 'text' | 'number' | 'integer' | 'boolean' | 'select' | 'textarea'| 'date';
  value: string | boolean | number | undefined;
  disabled: boolean;
  required: boolean;
  valueList?: Array<{ value: string | boolean | number; label?: string }>;
  placeholder?: string;
  hint?: string;
}
