import { createAction, props } from '@ngrx/store';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';
import { FormUpdateModel } from '../services/form-update.model';
import { FormFieldModel } from '@tailormap-viewer/api';

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

export const clearSelectedForm = createAction(
  `${formActionsPrefix} Clear Selected Form`,
);

export const loadDraftForm = createAction(
  `${formActionsPrefix} Load Draft Form`,
  props<{ id: number }>(),
);

export const loadDraftFormStart = createAction(
  `${formActionsPrefix} Load Draft Form Start`,
);

export const loadDraftFormSuccess = createAction(
  `${formActionsPrefix} Load Draft Form Success`,
  props<{ form: FormModel }>(),
);

export const loadDraftFormFailed = createAction(
  `${formActionsPrefix} Load Draft Form Failed`,
  props<{ error?: string }>(),
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
  props<{ form: FormUpdateModel }>(),
);

export const draftFormUpdateFields = createAction(
  `${formActionsPrefix} Draft Form Update Fields`,
  props<{ fields: FormFieldModel[] }>(),
);

export const draftFormAddField = createAction(
  `${formActionsPrefix} Draft Form Add Field`,
  props<{ name: string }>(),
);

export const draftFormSetSelectedField = createAction(
  `${formActionsPrefix} Draft Form Set Selected Field`,
  props<{ name: string }>(),
);

export const draftFormUpdateField = createAction(
  `${formActionsPrefix} Draft Form Update Field`,
  props<{ field: FormFieldModel }>(),
);

export const draftFormRemoveField = createAction(
  `${formActionsPrefix} Draft Form Remove Field`,
  props<{ field: string }>(),
);

export const updateDraftFormValid = createAction(
  `${formActionsPrefix} Update Draft Form Valid`,
  props<{ isValid: boolean }>(),
);
