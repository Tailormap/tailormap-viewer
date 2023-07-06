export interface FormFieldModel {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  value: string | boolean | number | undefined;
  disabled: boolean;
  required: boolean;
  valueList?: Array<{ value: string | boolean | number; label?: string }>;
  placeholder?: string;
  hint?: string;
}
