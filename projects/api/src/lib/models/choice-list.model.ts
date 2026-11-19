export enum ChoiceListSourceEnum {
  /** The configured values. */
  LIST = 'list',
  /** The unique values of the attribute in the feature source. */
  UNIQUE_VALUES = 'uniqueValues',
}

export interface ChoiceListValueModel {
  /** The API sends a string. The viewer parses it to the attribute type, so it can also be a number or boolean. */
  value: string | number | boolean;
  /** Shown instead of the value. The value is shown when not set. */
  label?: string | null;
}

/** The choices for a form field with a select control. */
export interface ChoiceListModel {
  source: ChoiceListSourceEnum;
  /** The configured choices in the order to show them. Used when the source is a list, kept but ignored for other sources. */
  values?: ChoiceListValueModel[];
  /** The user can also enter a value which is not one of the choices. */
  allowFreeInput?: boolean;
}
