import * as ApplicationActions from './application.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { ApplicationState, initialApplicationState } from './application.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationModel } from '@tailormap-admin/admin-api';

const getApplication = (application: ApplicationModel) => ({
  ...application,
  id: `${application.id}`,
});

const onLoadApplicationStart = (state: ApplicationState): ApplicationState => ({
  ...state,
  applicationsLoadStatus: LoadingStateEnum.LOADING,
  applicationsLoadError: undefined,
  applications: [],
});

const onLoadApplicationsSuccess = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.loadApplicationsSuccess>,
): ApplicationState => ({
  ...state,
  applicationsLoadStatus: LoadingStateEnum.LOADED,
  applicationsLoadError: undefined,
  applications: payload.applications.map(getApplication),
});

const onLoadApplicationsFailed = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.loadApplicationsFailed>,
): ApplicationState => ({
  ...state,
  applicationsLoadStatus: LoadingStateEnum.FAILED,
  applicationsLoadError: payload.error,
  applications: [],
});

const onSetApplicationListFilter = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.setApplicationListFilter>,
): ApplicationState => ({
  ...state,
  applicationListFilter: payload.filter,
});

const onSetSelectedApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.setSelectedApplication>,
): ApplicationState => ({
  ...state,
  selectedApplication: payload.applicationId,
});

const onAddApplications = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.addApplications>,
): ApplicationState => ({
  ...state,
  applications: [
    ...state.applications,
    ...payload.applications.map(getApplication),
  ],
});

const onUpdateApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplication>,
): ApplicationState => {
  const updatedApplication = getApplication(payload.application);
  const idx = state.applications.findIndex(application => application.id === updatedApplication.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    applications: [
      ...state.applications.slice(0, idx),
      updatedApplication,
      ...state.applications.slice(idx + 1),
    ],
  };
};

const onDeleteApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.deleteApplication>,
): ApplicationState => ({
  ...state,
  applications: state.applications.filter(application => application.id !== payload.applicationId),
});

const applicationReducerImpl = createReducer<ApplicationState>(
  initialApplicationState,
  on(ApplicationActions.loadApplicationsStart, onLoadApplicationStart),
  on(ApplicationActions.loadApplicationsSuccess, onLoadApplicationsSuccess),
  on(ApplicationActions.loadApplicationsFailed, onLoadApplicationsFailed),
  on(ApplicationActions.setApplicationListFilter, onSetApplicationListFilter),
  on(ApplicationActions.setSelectedApplication, onSetSelectedApplication),
  on(ApplicationActions.addApplications, onAddApplications),
  on(ApplicationActions.updateApplication, onUpdateApplication),
  on(ApplicationActions.deleteApplication, onDeleteApplication),
);
export const applicationReducer = (state: ApplicationState | undefined, action: Action) => applicationReducerImpl(state, action);
