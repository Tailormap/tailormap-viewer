import { FormFieldControlTypeEnum } from './form-field-control-type.enum';
import { FormFieldValueListItemModel } from './form-field-value-list-item.model';

export interface FormFieldModel {
  name: string;
  label: string;
  /** The edit control for this field. Not the data type of the attribute, but it must be suitable for it. */
  controlType: FormFieldControlTypeEnum;
  tab?: string;
  uniqueValuesAsOptions?: boolean;
  valueList?: FormFieldValueListItemModel[];
  allowValueListOnly?: boolean;
  /** The field is shown but its value can't be changed. A field is also read-only when its attribute is not editable. */
  readOnly?: boolean;
  required?: boolean;
  autoFillUser?: boolean;
  autoFillDate?: boolean;
  placeholder?: string;
  hint?: string;
}
