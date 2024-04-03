import * as FormActions from './form.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FormState, initialFormState } from './form.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FormFieldTypeEnum, FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';

const summaryFromForm = (form: FormModel): FormSummaryModel => ({
  id: form.id,
  name: form.name,
  featureSourceId: form.featureSourceId,
  featureTypeName: form.featureTypeName,
});

const onLoadFormsStart = (state: FormState): FormState => ({
  ...state,
  formsLoadStatus: LoadingStateEnum.LOADING,
  formsLoadError: undefined,
  forms: [],
});

const onLoadFormsSuccess = (
  state: FormState,
  payload: ReturnType<typeof FormActions.loadFormsSuccess>,
): FormState => ({
  ...state,
  formsLoadStatus: LoadingStateEnum.LOADED,
  formsLoadError: undefined,
  forms: payload.forms,
});

const onLoadFormsFailed = (
  state: FormState,
  payload: ReturnType<typeof FormActions.loadFormsFailed>,
): FormState => ({
  ...state,
  formsLoadStatus: LoadingStateEnum.FAILED,
  formsLoadError: payload.error,
  forms: [],
});

const onSetFormListFilter = (
  state: FormState,
  payload: ReturnType<typeof FormActions.setFormListFilter>,
): FormState => ({
  ...state,
  formsListFilter: payload.filter,
});

const onClearSelectedForm = (
  state: FormState,
): FormState => ({
  ...state,
  draftFormId: null,
  draftFormSelectedAttribute: null,
});

const onLoadDraftForm = (state: FormState, payload: ReturnType<typeof FormActions.loadDraftForm>): FormState => ({
  ...state,
  draftFormId: payload.id,
  draftFormSelectedAttribute: null,
});

const onLoadDraftFormStart = (state: FormState): FormState => ({
  ...state,
  draftFormLoadStatus: LoadingStateEnum.LOADING,
  draftFormSelectedAttribute: null,
  draftForm: null,
});

const onLoadDraftFormSuccess = (state: FormState, payload: ReturnType<typeof FormActions.loadDraftFormSuccess>): FormState => ({
  ...state,
  draftFormLoadStatus: LoadingStateEnum.LOADED,
  draftFormSelectedAttribute: null,
  draftForm: payload.form,
  draftFormValid: true,
  draftFormUpdated: false,
});

const onLoadDraftFormFailed = (state: FormState): FormState => ({
  ...state,
  draftFormId: null,
  draftFormLoadStatus: LoadingStateEnum.FAILED,
  draftFormSelectedAttribute: null,
  draftForm: null,
});

const onAddForm = (
  state: FormState,
  payload: ReturnType<typeof FormActions.addForm>,
): FormState => ({
  ...state,
  forms: [
    ...state.forms,
    summaryFromForm(payload.form),
  ],
});

const onUpdateForm = (
  state: FormState,
  payload: ReturnType<typeof FormActions.updateForm>,
): FormState => {
  const formIdx = state.forms.findIndex(f => f.id === payload.form.id);
  if (formIdx === -1) {
    return state;
  }
  return {
    ...state,
    forms: [
      ...state.forms.slice(0, formIdx),
      summaryFromForm(payload.form),
      ...state.forms.slice(formIdx + 1),
    ],
    draftForm: payload.form.id === state.draftForm?.id
      ? payload.form
      : state.draftForm,
  };
};

const onDeleteForm = (
  state: FormState,
  payload: ReturnType<typeof FormActions.deleteForm>,
): FormState => {
  const formIdx = state.forms.findIndex(f => f.id === payload.formId);
  if (formIdx === -1) {
    return state;
  }
  return {
    ...state,
    forms: [
      ...state.forms.slice(0, formIdx),
      ...state.forms.slice(formIdx + 1),
    ],
    draftForm: payload.formId === state.draftForm?.id
      ? null
      : state.draftForm,
  };
};

const onUpdateDraftForm = (
  state: FormState,
  payload: ReturnType<typeof FormActions.updateDraftForm>,
): FormState => ({
  ...state,
  draftFormUpdated: true,
  draftForm: state.draftForm ? {
    ...state.draftForm,
    ...payload.form,
  } : null,
});

const onDraftFormAddField = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormAddField>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }
  const fieldIdx = state.draftForm.fields.findIndex(f => f.name === payload.name);
  if (fieldIdx !== -1) {
    return state;
  }
  return {
    ...state,
    draftForm: {
      ...state.draftForm,
      fields: [
        ...state.draftForm.fields,
        { name: payload.name, type: FormFieldTypeEnum.TEXT, label: payload.name },
      ],
    },
    draftFormSelectedAttribute: payload.name,
    draftFormUpdated: true,
  };
};

const onDraftFormSetSelectedField = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormSetSelectedField>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }
  const fieldIdx = state.draftForm.fields.findIndex(f => f.name === payload.name);
  if (fieldIdx === -1) {
    return state;
  }
  return {
    ...state,
    draftFormSelectedAttribute: payload.name,
  };
};

const onDraftFormUpdateField = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormUpdateField>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }
  const fieldIdx = state.draftForm.fields.findIndex(f => f.name === payload.field.name);
  if (fieldIdx === -1) {
    return state;
  }
  return {
    ...state,
    draftForm: {
      ...state.draftForm,
      fields: [
        ...state.draftForm.fields.slice(0, fieldIdx),
        payload.field,
        ...state.draftForm.fields.slice(fieldIdx + 1),
      ],
    },
    draftFormUpdated: true,
  };
};

const onUpdateDraftFormValid = (
  state: FormState,
  payload: ReturnType<typeof FormActions.updateDraftFormValid>,
): FormState => ({
  ...state,
  draftFormValid: payload.isValid,
});

const formReducerImpl = createReducer<FormState>(
  initialFormState,
  on(FormActions.loadFormsStart, onLoadFormsStart),
  on(FormActions.loadFormsSuccess, onLoadFormsSuccess),
  on(FormActions.loadFormsFailed, onLoadFormsFailed),
  on(FormActions.setFormListFilter, onSetFormListFilter),
  on(FormActions.clearSelectedForm, onClearSelectedForm),
  on(FormActions.loadDraftForm, onLoadDraftForm),
  on(FormActions.loadDraftFormStart, onLoadDraftFormStart),
  on(FormActions.loadDraftFormSuccess, onLoadDraftFormSuccess),
  on(FormActions.loadDraftFormFailed, onLoadDraftFormFailed),
  on(FormActions.addForm, onAddForm),
  on(FormActions.updateForm, onUpdateForm),
  on(FormActions.deleteForm, onDeleteForm),
  on(FormActions.updateDraftForm, onUpdateDraftForm),
  on(FormActions.draftFormAddField, onDraftFormAddField),
  on(FormActions.draftFormSetSelectedField, onDraftFormSetSelectedField),
  on(FormActions.draftFormUpdateField, onDraftFormUpdateField),
  on(FormActions.updateDraftFormValid, onUpdateDraftFormValid),
);
export const formReducer = (state: FormState | undefined, action: Action) => formReducerImpl(state, action);
