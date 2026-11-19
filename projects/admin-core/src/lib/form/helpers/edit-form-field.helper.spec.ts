import { describe, test, expect } from 'vitest';
import { AttributeType, FormFieldControlTypeEnum } from '@tailormap-viewer/api';
import { EditFormFieldHelper } from './edit-form-field.helper';

describe('EditFormFieldHelper', () => {

  test('default field control is based on the attribute type', () => {
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.STRING })).toBe(FormFieldControlTypeEnum.TEXT);
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.DATE })).toBe(FormFieldControlTypeEnum.DATE);
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.TIMESTAMP })).toBe(FormFieldControlTypeEnum.DATETIME);
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.INTEGER })).toBe(FormFieldControlTypeEnum.NUMBER);
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.DOUBLE })).toBe(FormFieldControlTypeEnum.NUMBER);
    expect(EditFormFieldHelper.getDefaultControlType({ type: AttributeType.BOOLEAN })).toBe(FormFieldControlTypeEnum.CHECKBOX);
    expect(EditFormFieldHelper.getDefaultControlType(null)).toBe(FormFieldControlTypeEnum.TEXT);
  });

  test('default field control is always allowed for the attribute type', () => {
    const types = [
      AttributeType.STRING, AttributeType.DATE, AttributeType.TIMESTAMP, AttributeType.INTEGER,
      AttributeType.NUMBER, AttributeType.DOUBLE, AttributeType.BOOLEAN,
    ];
    types.forEach(type => {
      const allowed = EditFormFieldHelper.controlTypes.filter(f => f.allowedForAttributeTypes.includes(type)).map(f => f.value);
      expect(allowed).toContain(EditFormFieldHelper.getDefaultControlType({ type }));
    });
  });

  test('corrects field controls which are incompatible with the attribute type', () => {
    const fields = [
      { name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.TEXTAREA },
      { name: 'created', label: 'Created', controlType: FormFieldControlTypeEnum.TEXT },
      { name: 'count', label: 'Count', controlType: FormFieldControlTypeEnum.SELECT },
      { name: 'removed', label: 'Removed', controlType: FormFieldControlTypeEnum.TEXT },
    ];
    const attributes = [
      { name: 'name', type: AttributeType.STRING },
      { name: 'created', type: AttributeType.DATE },
      { name: 'count', type: AttributeType.INTEGER },
    ];
    const corrected = EditFormFieldHelper.correctControlTypes(fields, attributes);
    expect(corrected?.map(f => f.controlType)).toEqual([
      FormFieldControlTypeEnum.TEXTAREA, FormFieldControlTypeEnum.DATE, FormFieldControlTypeEnum.SELECT, FormFieldControlTypeEnum.TEXT,
    ]);
    expect(corrected?.[1]).toEqual({ name: 'created', label: 'Created', controlType: FormFieldControlTypeEnum.DATE });
  });

  test('returns null when no field controls need correcting', () => {
    const fields = [{ name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.TEXT }];
    expect(EditFormFieldHelper.correctControlTypes(fields, [{ name: 'name', type: AttributeType.STRING }])).toBeNull();
  });

});
