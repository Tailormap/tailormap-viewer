import * as ApplicationActions from './application.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { ApplicationState, initialApplicationState } from './application.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { AppContentModel, ApplicationModel, AppTreeLevelNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from '../helpers/application-model.helper';

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

const onAddApplicationTreeNodes = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.addApplicationTreeNodes>,
): ApplicationState => {
  const idx = state.applications.findIndex(app => app.id === payload.applicationId);
  if (idx === -1) {
    return state;
  }
  const application = state.applications[idx];
  const tree: 'baseLayerNodes' | 'layerNodes' = payload.tree === 'baseLayer' ? 'baseLayerNodes' : 'layerNodes';
  const contentRoot: AppContentModel = application.contentRoot || { layerNodes: [], baseLayerNodes: [] };
  const updatedTree = [ ...(contentRoot[tree] || []), ...payload.treeNodes ];
  if (payload.parentId) {
    const parentIdx = updatedTree.findIndex(node => node.id === payload.parentId);
    if (parentIdx !== -1 && ApplicationModelHelper.isLevelTreeNode(updatedTree[parentIdx])) {
      const parent = updatedTree[parentIdx];
      if (ApplicationModelHelper.isLevelTreeNode(parent)) {
        const parentNode: AppTreeLevelNodeModel = {
          ...parent,
          childrenIds: [
            ...(parent.childrenIds || []),
            ...payload.treeNodes.map(node => node.id),
          ],
        };
        updatedTree[parentIdx] = parentNode;
      }
    }
  }
  const updatedContentRoot: AppContentModel = {
    ...contentRoot,
    [tree]: updatedTree,
  };
  return {
    ...state,
    applications: [
      ...state.applications.slice(0, idx),
      {
        ...application,
        contentRoot: updatedContentRoot,
      },
      ...state.applications.slice(idx + 1),
    ],
  };
};

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
  on(ApplicationActions.addApplicationTreeNodes, onAddApplicationTreeNodes),
);
export const applicationReducer = (state: ApplicationState | undefined, action: Action) => applicationReducerImpl(state, action);
