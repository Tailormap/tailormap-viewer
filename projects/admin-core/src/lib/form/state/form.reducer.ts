import * as FormActions from './form.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FormState, initialFormState } from './form.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';
import { FormFieldTypeEnum } from '@tailormap-viewer/api';

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
  draftFormSelectedTabId: null,
});

const onLoadDraftForm = (state: FormState, payload: ReturnType<typeof FormActions.loadDraftForm>): FormState => ({
  ...state,
  draftFormId: payload.id,
  draftFormSelectedAttribute: null,
  draftFormSelectedTabId: null,
});

const onLoadDraftFormStart = (state: FormState): FormState => ({
  ...state,
  draftFormLoadStatus: LoadingStateEnum.LOADING,
  draftFormSelectedAttribute: null,
  draftFormSelectedTabId: null,
  draftForm: null,
});

const onLoadDraftFormSuccess = (state: FormState, payload: ReturnType<typeof FormActions.loadDraftFormSuccess>): FormState => ({
  ...state,
  draftFormLoadStatus: LoadingStateEnum.LOADED,
  draftFormSelectedAttribute: null,
  draftFormSelectedTabId: null,
  draftForm: payload.form,
  draftFormValid: true,
  draftFormUpdated: false,
});

const onLoadDraftFormFailed = (state: FormState): FormState => ({
  ...state,
  draftFormId: null,
  draftFormLoadStatus: LoadingStateEnum.FAILED,
  draftFormSelectedAttribute: null,
  draftFormSelectedTabId: null,
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

const onDraftFormUpdateFields = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormUpdateFields>,
): FormState => ({
  ...state,
  draftFormUpdated: true,
  draftForm: state.draftForm ? {
    ...state.draftForm,
    fields: payload.fields,
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
    draftFormSelectedTabId: null,
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
    draftFormSelectedTabId: null,
  };
};

const onDraftFormSetSelectedTabId = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormSetSelectedTabId>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }
  if (!(state.draftForm.options?.tabs || []).some(t => t.id === payload.tabId)) {
    return state;
  }
  return {
    ...state,
    draftFormSelectedAttribute: null,
    draftFormSelectedTabId: payload.tabId,
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

const onDraftFormRemoveField = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormRemoveField>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }
  const fieldIdx = state.draftForm.fields.findIndex(f => f.name === payload.field);
  if (fieldIdx === -1) {
    return state;
  }
  return {
    ...state,
    draftForm: {
      ...state.draftForm,
      fields: [
        ...state.draftForm.fields.slice(0, fieldIdx),
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

const onDraftFormAddTab = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormAddTab>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }

  const tabs = state.draftForm.options?.tabs || [];
  const tabExists = tabs.some(tab => tab.id === payload.tabId || tab.name === payload.tabName);

  if (tabExists) {
    return state;
  }

  return {
    ...state,
    draftFormUpdated: true,
    draftForm: {
      ...state.draftForm,
      options: {
        ...state.draftForm.options,
        tabs: [
          ...tabs,
          { id: payload.tabId, name: payload.tabName },
        ],
      },
    },
  };
};

const onDraftFormUpdateTabs = (
  state: FormState,
  payload: ReturnType<typeof FormActions.draftFormUpdateTabs>,
): FormState => {
  if (!state.draftForm) {
    return state;
  }

  const selectedTabRemoved = !!state.draftFormSelectedTabId
    && !payload.tabs.some(t => t.id === state.draftFormSelectedTabId);

  return {
    ...state,
    draftFormUpdated: true,
    draftFormSelectedTabId: selectedTabRemoved ? null : state.draftFormSelectedTabId,
    draftForm: {
      ...state.draftForm,
      options: {
        ...state.draftForm.options,
        tabs: payload.tabs,
      },
    },
  };
};

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
  on(FormActions.draftFormUpdateFields, onDraftFormUpdateFields),
  on(FormActions.draftFormAddField, onDraftFormAddField),
  on(FormActions.draftFormSetSelectedField, onDraftFormSetSelectedField),
  on(FormActions.draftFormSetSelectedTabId, onDraftFormSetSelectedTabId),
  on(FormActions.draftFormUpdateField, onDraftFormUpdateField),
  on(FormActions.draftFormRemoveField, onDraftFormRemoveField),
  on(FormActions.updateDraftFormValid, onUpdateDraftFormValid),
  on(FormActions.draftFormAddTab, onDraftFormAddTab),
  on(FormActions.draftFormUpdateTabs, onDraftFormUpdateTabs),
);
export const formReducer = (state: FormState | undefined, action: Action) => formReducerImpl(state, action);
