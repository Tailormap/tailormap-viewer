import { describe, test, expect } from 'vitest';
import { AttributeType, FormFieldTypeEnum } from '@tailormap-viewer/api';
import { FormModel } from '@tailormap-admin/admin-api';
import { formReducer } from './form.reducer';
import { FormState, initialFormState } from './form.state';
import { draftFormCorrectFieldTypes, updateDraftFormFieldValid } from './form.actions';

const draftForm: FormModel = {
  id: 1,
  name: 'form',
  featureSourceId: 1,
  featureTypeName: 'table',
  options: { columns: 1, tabs: [] },
  fields: [
    { name: 'name', label: 'Name', type: FormFieldTypeEnum.TEXT },
    { name: 'created', label: 'Created', type: FormFieldTypeEnum.TEXT },
  ],
};

const getState = (): FormState => ({ ...initialFormState, draftForm, draftFormUpdated: false });

describe('FormReducer', () => {

  test('corrects incompatible field types and marks the draft form as updated', () => {
    const state = formReducer(getState(), draftFormCorrectFieldTypes({
      attributes: [{ name: 'name', type: AttributeType.STRING }, { name: 'created', type: AttributeType.DATE }],
    }));
    expect(state.draftForm?.fields.map(f => f.type)).toEqual([ FormFieldTypeEnum.TEXT, FormFieldTypeEnum.DATE ]);
    expect(state.draftFormUpdated).toBe(true);
  });

  test('does not change state when no field types need correcting', () => {
    const state = getState();
    const newState = formReducer(state, draftFormCorrectFieldTypes({
      attributes: [{ name: 'name', type: AttributeType.STRING }, { name: 'created', type: AttributeType.STRING }],
    }));
    expect(newState).toBe(state);
  });

  test('tracks field editor validity', () => {
    const state = formReducer(getState(), updateDraftFormFieldValid({ isValid: false }));
    expect(state.draftFormFieldValid).toBe(false);
  });

});
