/**
 * The edit control for a form field. Not the data type of the attribute: for example whether a number must be a whole
 * number follows from the attribute type.
 */
export enum FormFieldControlTypeEnum {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  DATE = 'date',
  DATETIME = 'datetime',
}
