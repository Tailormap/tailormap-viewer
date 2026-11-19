import { describe, test, expect } from 'vitest';
import { FormSummaryModel } from '@tailormap-admin/admin-api';
import { FormNameHelper } from './form-name.helper';

const forms: FormSummaryModel[] = [
  { id: 1, name: 'Inspection', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 2, name: 'Copy of Inspection', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 3, name: 'Other', featureSourceId: 8, featureTypeName: 'inspections' },
];

describe('FormNameHelper', () => {

  test('detects a taken name for the same feature type, ignoring case and whitespace', () => {
    expect(FormNameHelper.isNameTaken(forms, ' inspection ', 7, 'inspections')).toBe(true);
    expect(FormNameHelper.isNameTaken(forms, 'Inspection 2', 7, 'inspections')).toBe(false);
  });

  test('allows the same name for another feature type or feature source', () => {
    expect(FormNameHelper.isNameTaken(forms, 'Inspection', 7, 'other_type')).toBe(false);
    expect(FormNameHelper.isNameTaken(forms, 'Other', 7, 'inspections')).toBe(false);
  });

  test('ignores the form itself and incomplete input', () => {
    expect(FormNameHelper.isNameTaken(forms, 'Inspection', 7, 'inspections', 1)).toBe(false);
    expect(FormNameHelper.isNameTaken(forms, '', 7, 'inspections')).toBe(false);
    expect(FormNameHelper.isNameTaken(forms, 'Inspection', null, 'inspections')).toBe(false);
    expect(FormNameHelper.isNameTaken(forms, 'Inspection', 7, null)).toBe(false);
  });

  test('returns a unique name with a numbered suffix', () => {
    expect(FormNameHelper.getUniqueName(forms, 'New', 7, 'inspections')).toBe('New');
    expect(FormNameHelper.getUniqueName(forms, 'Copy of Inspection', 7, 'inspections')).toBe('Copy of Inspection (2)');
    const moreForms = [ ...forms, { id: 4, name: 'Copy of Inspection (2)', featureSourceId: 7, featureTypeName: 'inspections' }];
    expect(FormNameHelper.getUniqueName(moreForms, 'Copy of Inspection', 7, 'inspections')).toBe('Copy of Inspection (3)');
  });

});
