import { createAction, props } from '@ngrx/store';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';

const formActionsPrefix = '[Admin/Form]';

export const loadForms = createAction(
  `${formActionsPrefix} Load Forms`,
);

export const loadFormsStart = createAction(
  `${formActionsPrefix} Load Forms Start`,
);

export const loadFormsSuccess = createAction(
  `${formActionsPrefix}  Load Forms Success`,
  props<{ forms: FormSummaryModel[] }>(),
);

export const loadFormsFailed = createAction(
  `${formActionsPrefix}  Load Forms Failed`,
  props<{ error?: string }>(),
);

export const setFormListFilter = createAction(
  `${formActionsPrefix} Set Form List Filter`,
  props<{ filter: string | null | undefined }>(),
);

export const setSelectedForm = createAction(
  `${formActionsPrefix} Set Selected Form`,
  props<{ formId: number | null }>(),
);

export const clearSelectedForm = createAction(
  `${formActionsPrefix} Clear Selected Form`,
);

export const addForm = createAction(
  `${formActionsPrefix} Add Form`,
  props<{ form: FormModel }>(),
);

export const updateForm = createAction(
  `${formActionsPrefix} Update Form`,
  props<{ form: FormModel }>(),
);

export const deleteForm = createAction(
  `${formActionsPrefix} Delete Form`,
  props<{ formId: number }>(),
);

export const updateDraftForm = createAction(
  `${formActionsPrefix} Update Draft Form`,
  props<{ form: Omit<FormModel, 'id'> }>(),
);

export const updateDraftFormValid = createAction(
  `${formActionsPrefix} Update Draft Form Valid`,
  props<{ isValid: boolean }>(),
);
