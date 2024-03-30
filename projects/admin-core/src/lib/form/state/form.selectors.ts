import { FormState, formStateKey } from './form.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FormSummaryModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';

const selectFormState = createFeatureSelector<FormState>(formStateKey);

export const selectFormsLoadStatus = createSelector(selectFormState, state => state.formsLoadStatus);
export const selectFormsLoadError = createSelector(selectFormState, state => state.formsLoadError);
export const selectForms = createSelector(selectFormState, state => state.forms);
export const selectFormsListFilter = createSelector(selectFormState, state => state.formsListFilter);
export const selectDraftFormId = createSelector(selectFormState, state => state.draftFormId);
export const selectDraftForm = createSelector(selectFormState, state => state.draftForm);
export const selectDraftFormLoadStatus = createSelector(selectFormState, state => state.draftFormLoadStatus);
export const selectDraftFormSelectedAttribute = createSelector(selectFormState, state => state.draftFormSelectedAttribute);
export const selectDraftFormUpdated = createSelector(selectFormState, state => state.draftFormUpdated);
export const selectDraftFormValid = createSelector(selectFormState, state => state.draftFormValid);

export const selectFilteredFormsList = createSelector(
  selectForms,
  selectDraftFormId,
  selectFormsListFilter,
  (forms, draftFormId, filter): Array<FormSummaryModel & { selected: boolean }> => {
    return FilterHelper.filterByTerm(forms, filter, form => form.name)
      .map(a => ({
        ...a,
        selected: a.id === draftFormId,
      }))
      .sort((a, b) => {
        return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
      });
  },
);

export const selectDraftFormField = createSelector(
  selectDraftForm,
  draftForm => draftForm?.fields || [],
);

export const selectDraftFormAttributes = createSelector(
  selectDraftForm,
  draftForm => (draftForm?.fields || []).map(f => f.name),
);

export const selectDraftFormSelectedField = createSelector(
  selectDraftFormField,
  selectDraftFormSelectedAttribute,
  (fields, selectedAttribute) => {
    console.log(fields, selectedAttribute);
    return fields.find(f => f.name === selectedAttribute) || null;
  },
);
