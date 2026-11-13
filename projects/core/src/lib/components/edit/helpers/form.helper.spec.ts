import { describe, expect, test } from 'vitest';
import { AttributeType, FormFieldControlTypeEnum } from '@tailormap-viewer/api';
import { FormHelper } from './form.helper';
import { ViewerEditFormFieldModel } from '../models/viewer-edit-form-field.model';

const getField = (overrides: Partial<ViewerEditFormFieldModel>): ViewerEditFormFieldModel => ({
  name: 'field',
  label: 'Field',
  controlType: FormFieldControlTypeEnum.NUMBER,
  attributeType: AttributeType.DOUBLE,
  value: undefined,
  ...overrides,
});

const isValid = (field: ViewerEditFormFieldModel, value: string | number | boolean | null) => {
  const control = FormHelper.createForm([field]).get(field.name);
  control?.setValue(value);
  return control?.valid;
};

describe('FormHelper', () => {

  test('number control accepts decimals for a decimal attribute', () => {
    expect(isValid(getField({}), '1.5')).toBe(true);
    expect(isValid(getField({}), 'abc')).toBe(false);
  });

  test('number control only accepts whole numbers for an integer attribute', () => {
    const field = getField({ attributeType: AttributeType.INTEGER });
    expect(isValid(field, '42')).toBe(true);
    expect(isValid(field, '-3')).toBe(true);
    expect(isValid(field, '1.5')).toBe(false);
  });

  test('a required checkbox does not have to be checked', () => {
    const field = getField({ controlType: FormFieldControlTypeEnum.CHECKBOX, attributeType: AttributeType.BOOLEAN, required: true });
    expect(isValid(field, null)).toBe(true);
  });

  test('a read-only field is disabled', () => {
    const form = FormHelper.createForm([getField({ readOnly: true })]);
    expect(form.get('field')?.disabled).toBe(true);
  });

});
