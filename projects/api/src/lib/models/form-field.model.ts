import { FormFieldControlTypeEnum } from './form-field-control-type.enum';
import { ChoiceListModel } from './choice-list.model';

export interface FormFieldModel {
  name: string;
  label: string;
  /** The edit control for this field. Not the data type of the attribute, but it must be suitable for it. */
  controlType: FormFieldControlTypeEnum;
  tab?: string;
  /** The choices for a select control. */
  choiceList?: ChoiceListModel;
  /** The field is shown but its value can't be changed. A field is also read-only when its attribute is not editable. */
  readOnly?: boolean;
  required?: boolean;
  autoFillUser?: boolean;
  autoFillDate?: boolean;
  placeholder?: string;
  hint?: string;
}
