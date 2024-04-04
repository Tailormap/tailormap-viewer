import { FormState, formStateKey } from './form.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FormSummaryModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { FormFieldModel } from '@tailormap-viewer/api';
import { selectFeatureTypes } from '../../catalog/state/catalog.selectors';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';

export type FormList = Array<FormSummaryModel & { selected: boolean; featureType?: ExtendedFeatureTypeModel }>;

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

export const selectFormsForFeatureType = (featureSourceId: string, featureTypeName?: string) => createSelector(
  selectForms,
  forms => {
    if (!featureTypeName) {
      return [];
    }
    const fsId = +(featureSourceId);
    return forms.filter(f => f.featureSourceId === fsId && f.featureTypeName === featureTypeName);
  },
);

export const selectFilteredFormsList = createSelector(
  selectForms,
  selectDraftFormId,
  selectFormsListFilter,
  selectFeatureTypes,
  (forms, draftFormId, filter, featureTypes): FormList => {
    return FilterHelper.filterByTerm(forms, filter, form => [ form.name, form.featureTypeName ].join(''))
      .map(a => ({
        ...a,
        featureType: featureTypes.find(ft => ft.name === a.featureTypeName && ft.featureSourceId === `${a.featureSourceId}`),
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

export const selectDraftFormFieldsWithSelected = createSelector(
  selectDraftFormField,
  selectDraftFormSelectedAttribute,
  (fields, selectedField): Array<FormFieldModel & { selected?: boolean }> => {
    if (!selectedField) {
      return fields;
    }
    return fields.map(f => ({
      ...f,
      selected: f.name === selectedField,
    }));
  },
);

export const selectDraftFormSelectedField = createSelector(
  selectDraftFormField,
  selectDraftFormSelectedAttribute,
  (fields, selectedAttribute) => {
    return fields.find(f => f.name === selectedAttribute) || null;
  },
);
