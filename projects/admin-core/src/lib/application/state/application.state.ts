import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationModel } from '@tailormap-admin/admin-api';

export const applicationStateKey = 'application';

export interface ApplicationState {
  applicationsLoadStatus: LoadingStateEnum;
  applicationsLoadError?: string;
  applicationServicesLoadStatus: LoadingStateEnum;
  applications: ApplicationModel[];
  applicationListFilter?: string | null;
  selectedApplication?: string | null;
}

export const initialApplicationState: ApplicationState = {
  applicationsLoadStatus: LoadingStateEnum.INITIAL,
  applications: [],
  applicationServicesLoadStatus: LoadingStateEnum.INITIAL,
};
