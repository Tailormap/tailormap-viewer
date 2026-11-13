import { describe, test, expect } from 'vitest';
import { AttributeType, FormFieldTypeEnum } from '@tailormap-viewer/api';
import { EditFormFieldHelper } from './edit-form-field.helper';

describe('EditFormFieldHelper', () => {

  test('default field type is based on the attribute type', () => {
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.STRING })).toBe(FormFieldTypeEnum.TEXT);
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.DATE })).toBe(FormFieldTypeEnum.DATE);
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.TIMESTAMP })).toBe(FormFieldTypeEnum.TIMESTAMP);
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.INTEGER })).toBe(FormFieldTypeEnum.INTEGER);
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.DOUBLE })).toBe(FormFieldTypeEnum.NUMBER);
    expect(EditFormFieldHelper.getDefaultFieldType({ type: AttributeType.BOOLEAN })).toBe(FormFieldTypeEnum.BOOLEAN);
    expect(EditFormFieldHelper.getDefaultFieldType(null)).toBe(FormFieldTypeEnum.TEXT);
  });

  test('default field type is always allowed for the attribute type', () => {
    const types = [
      AttributeType.STRING, AttributeType.DATE, AttributeType.TIMESTAMP, AttributeType.INTEGER,
      AttributeType.NUMBER, AttributeType.DOUBLE, AttributeType.BOOLEAN,
    ];
    types.forEach(type => {
      const allowed = EditFormFieldHelper.fieldTypes.filter(f => f.allowedForAttributeTypes.includes(type)).map(f => f.value);
      expect(allowed).toContain(EditFormFieldHelper.getDefaultFieldType({ type }));
    });
  });

  test('corrects field types which are incompatible with the attribute type', () => {
    const fields = [
      { name: 'name', label: 'Name', type: FormFieldTypeEnum.TEXTAREA },
      { name: 'created', label: 'Created', type: FormFieldTypeEnum.TEXT },
      { name: 'count', label: 'Count', type: FormFieldTypeEnum.SELECT },
      { name: 'removed', label: 'Removed', type: FormFieldTypeEnum.TEXT },
    ];
    const attributes = [
      { name: 'name', type: AttributeType.STRING },
      { name: 'created', type: AttributeType.DATE },
      { name: 'count', type: AttributeType.INTEGER },
    ];
    const corrected = EditFormFieldHelper.correctFieldTypes(fields, attributes);
    expect(corrected?.map(f => f.type)).toEqual([
      FormFieldTypeEnum.TEXTAREA, FormFieldTypeEnum.DATE, FormFieldTypeEnum.SELECT, FormFieldTypeEnum.TEXT,
    ]);
    expect(corrected?.[1]).toEqual({ name: 'created', label: 'Created', type: FormFieldTypeEnum.DATE });
  });

  test('returns null when no field types need correcting', () => {
    const fields = [{ name: 'name', label: 'Name', type: FormFieldTypeEnum.TEXT }];
    expect(EditFormFieldHelper.correctFieldTypes(fields, [{ name: 'name', type: AttributeType.STRING }])).toBeNull();
  });

});
