import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';

export const formStateKey = 'admin-form';

export interface FormState {
  formsLoadStatus: LoadingStateEnum;
  formsLoadError?: string;
  forms: FormSummaryModel[];
  formsListFilter?: string | null;
  draftFormId?: number | null;
  draftForm: FormModel | null;
  draftFormLoadStatus: LoadingStateEnum;
  draftFormUpdated: boolean;
  draftFormValid: boolean;
}

export const initialFormState: FormState = {
  formsLoadStatus: LoadingStateEnum.INITIAL,
  forms: [],
  draftFormId: null,
  draftForm: null,
  draftFormLoadStatus: LoadingStateEnum.INITIAL,
  draftFormUpdated: false,
  draftFormValid: false,
};
