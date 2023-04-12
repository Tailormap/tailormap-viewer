import * as ApplicationActions from './application.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { ApplicationState, initialApplicationState } from './application.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { AppContentModel, ApplicationModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from '../helpers/application-model.helper';

const getApplication = (application: ApplicationModel) => ({
  ...application,
  id: `${application.id}`,
});

const updateApplicationTree = (
  state: ApplicationState,
  applicationId: string,
  treeKey: 'layer' | 'baseLayer',
  updateMethod: (application: ApplicationModel, tree: AppTreeNodeModel[]) => AppTreeNodeModel[],
) => {
  const idx = state.applications.findIndex(app => app.id === applicationId);
  if (idx === -1) {
    return state;
  }
  const application = state.applications[idx];
  const tree: 'baseLayerNodes' | 'layerNodes' = treeKey === 'baseLayer' ? 'baseLayerNodes' : 'layerNodes';
  const contentRoot = ApplicationModelHelper.getApplicationContentRoot(application);
  const updatedContentRoot: AppContentModel = {
    ...contentRoot,
    [tree]: updateMethod(application, contentRoot[tree]),
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
  return updateApplicationTree(state, payload.applicationId, payload.tree, (application, tree) => {
    return ApplicationModelHelper.addNodesToApplicationTree(application, tree, payload);
  });
};

const onUpdateApplicationTreeNode = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeNode>,
): ApplicationState => {
  return updateApplicationTree(state, payload.applicationId, payload.tree, (application, tree) => {
    const idx = tree.findIndex(node => node.id === payload.nodeId);
    if (idx === -1) {
      return tree;
    }
    return [
      ...tree.slice(0, idx),
      {
        ...tree[idx],
        ...payload.updatedNode,
      },
      ...tree.slice(idx + 1),
    ];
  });
};

const onRemoveApplicationTreeNode = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.removeApplicationTreeNode>,
): ApplicationState => {
  return updateApplicationTree(state, payload.applicationId, payload.tree, (application, tree) => {
    const idx = tree.findIndex(node => node.id === payload.nodeId);
    if (idx === -1) {
      return tree;
    }
    return [
      ...tree.slice(0, idx),
      ...tree.slice(idx + 1),
    ];
  });
};

export const onUpdateApplicationTreeOrder = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeOrder>,
): ApplicationState => {
  return updateApplicationTree(state, payload.applicationId, payload.tree, (application, tree) => {
    return ApplicationModelHelper.updateApplicationOrder(application, tree, payload);
  });
};

export const onUpdateApplicationTreeNodeVisibility = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeNodeVisibility>,
): ApplicationState => {
  const visibilityChanged = new Map<string, boolean>(payload.visibility.map(v => [ v.nodeId, v.visible ]));
  return updateApplicationTree(state, payload.applicationId, payload.tree, (_, tree) => {
    return tree.map(node => {
      if (ApplicationModelHelper.isLayerTreeNode(node) && visibilityChanged.has(node.id)) {
        return { ...node, visible: !!visibilityChanged.get(node.id) };
      }
      return node;
    });
  });
};

const onLoadApplicationServices = (state: ApplicationState): ApplicationState => ({
  ...state,
  applicationServicesLoadStatus: LoadingStateEnum.LOADING,
});

const onLoadApplicationServicesSuccess = (state: ApplicationState): ApplicationState => ({
  ...state,
  applicationServicesLoadStatus: LoadingStateEnum.LOADED,
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
  on(ApplicationActions.addApplicationTreeNodes, onAddApplicationTreeNodes),
  on(ApplicationActions.updateApplicationTreeNode, onUpdateApplicationTreeNode),
  on(ApplicationActions.removeApplicationTreeNode, onRemoveApplicationTreeNode),
  on(ApplicationActions.updateApplicationTreeOrder, onUpdateApplicationTreeOrder),
  on(ApplicationActions.updateApplicationTreeNodeVisibility, onUpdateApplicationTreeNodeVisibility),
  on(ApplicationActions.loadApplicationServices, onLoadApplicationServices),
  on(ApplicationActions.loadApplicationServicesSuccess, onLoadApplicationServicesSuccess),
);
export const applicationReducer = (state: ApplicationState | undefined, action: Action) => applicationReducerImpl(state, action);
