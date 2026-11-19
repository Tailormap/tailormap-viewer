import { describe, test, expect } from 'vitest';
import { AttributeType, FormFieldControlTypeEnum } from '@tailormap-viewer/api';
import { FormModel } from '@tailormap-admin/admin-api';
import { formReducer } from './form.reducer';
import { FormState, initialFormState } from './form.state';
import { draftFormAddTab, draftFormCorrectControlTypes, updateDraftFormFieldValid } from './form.actions';

const draftForm: FormModel = {
  id: 1,
  name: 'form',
  featureSourceId: 1,
  featureTypeName: 'table',
  options: { tabs: [] },
  fields: [
    { name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.TEXT },
    { name: 'created', label: 'Created', controlType: FormFieldControlTypeEnum.TEXT },
  ],
};

const getState = (): FormState => ({ ...initialFormState, draftForm, draftFormUpdated: false });

describe('FormReducer', () => {

  test('corrects incompatible field controls and marks the draft form as updated', () => {
    const state = formReducer(getState(), draftFormCorrectControlTypes({
      attributes: [{ name: 'name', type: AttributeType.STRING }, { name: 'created', type: AttributeType.DATE }],
    }));
    expect(state.draftForm?.fields.map(f => f.controlType)).toEqual([ FormFieldControlTypeEnum.TEXT, FormFieldControlTypeEnum.DATE ]);
    expect(state.draftFormUpdated).toBe(true);
  });

  test('does not change state when no field controls need correcting', () => {
    const state = getState();
    const newState = formReducer(state, draftFormCorrectControlTypes({
      attributes: [{ name: 'name', type: AttributeType.STRING }, { name: 'created', type: AttributeType.STRING }],
    }));
    expect(newState).toBe(state);
  });

  test('adds a tab with a label, but not a second tab with the same label', () => {
    const state = formReducer(getState(), draftFormAddTab({ tabId: 't1', tabLabel: 'General' }));
    expect(state.draftForm?.options.tabs).toEqual([{ id: 't1', label: 'General' }]);
    expect(formReducer(state, draftFormAddTab({ tabId: 't2', tabLabel: 'General' }))).toBe(state);
  });

  test('tracks field editor validity', () => {
    const state = formReducer(getState(), updateDraftFormFieldValid({ isValid: false }));
    expect(state.draftFormFieldValid).toBe(false);
  });

});
