import * as ApplicationActions from './application.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { ApplicationState, initialApplicationState } from './application.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  AppContentModel, ApplicationModel, AppTreeLayerNodeModel, AppTreeNodeModel,
} from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from '../helpers/application-model.helper';
import { ComponentModel } from '@tailormap-viewer/api';

const getApplication = (application: ApplicationModel) => ({
  ...application,
  id: `${application.id}`,
});

const getExpandableTreeNodes = (layerNodes: AppTreeNodeModel[] | undefined) => {
  return (layerNodes || []).filter(ApplicationModelHelper.isLevelTreeNode).map(n => n.id);
};

const setDraftApplication = (state: ApplicationState, applicationId: string | null) => {
  const draftApplication = applicationId !== null
    ? state.applications.find(a => a.id === applicationId)
    : null;
  return {
    ...state,
    draftApplicationId: applicationId,
    draftApplication: draftApplication ? { ...draftApplication } : null,
    expandedAppLayerNodes: draftApplication ? getExpandableTreeNodes(draftApplication.contentRoot?.layerNodes) : [],
    expandedBaseLayerNodes: draftApplication ? getExpandableTreeNodes(draftApplication.contentRoot?.baseLayerNodes) : [],
    draftApplicationUpdated: false,
    draftApplicationValid: true,
  };
};

const updateApplication = (
  state: ApplicationState,
  updateMethod: (application: ApplicationModel) => Partial<ApplicationModel>,
) => {
  if (!state.draftApplication) {
    return state;
  }
  return {
    ...state,
    draftApplication: {
      ...state.draftApplication,
      ...updateMethod(state.draftApplication),
    },
    draftApplicationUpdated: true,
  };
};

const updateApplicationTree = (
  state: ApplicationState,
  treeKey: 'layer' | 'baseLayer' | 'terrainLayer',
  updateMethod: (application: ApplicationModel, tree: AppTreeNodeModel[]) => AppTreeNodeModel[],
  skipUpdatedFlag = false,
  expandNodes?: string[],
) => {
  if (!state.draftApplication) {
    return state;
  }
  const tree: 'layerNodes' | 'baseLayerNodes' | 'terrainLayerNodes' =
    treeKey === 'layer' ? 'layerNodes'
      : treeKey === 'baseLayer' ? 'baseLayerNodes'
      : 'terrainLayerNodes';
  const contentRoot = ApplicationModelHelper.getApplicationContentRoot(state.draftApplication);
  const updatedContentRoot: AppContentModel = {
    ...contentRoot,
    [tree]: updateMethod(state.draftApplication, contentRoot[tree]),
  };
  const expandedNodesList: 'expandedAppLayerNodes' | 'expandedBaseLayerNodes' = treeKey === 'baseLayer'
    ? 'expandedBaseLayerNodes'
    : 'expandedAppLayerNodes';
  return {
    ...state,
    [expandedNodesList]: [ ...state[expandedNodesList], ...(expandNodes ?? []) ],
    draftApplication: {
      ...state.draftApplication,
      contentRoot: updatedContentRoot,
    },
    draftApplicationUpdated: skipUpdatedFlag ? state.draftApplicationUpdated : true,
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
): ApplicationState => {
  return setDraftApplication(state, payload.applicationId);
};

const onClearSelectedApplication = (state: ApplicationState): ApplicationState => {
  return setDraftApplication(state, null);
};

const onAddApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.addApplication>,
): ApplicationState => {
  if(state.applications.some(a => a.id === payload.application.id)) {
    return state;
  }
  const addedApplication = getApplication(payload.application);
  const updatedState = {
    ...state,
    applications: [ ...state.applications, addedApplication ],
  };
  if (addedApplication.id === state.draftApplicationId) {
    return setDraftApplication(updatedState, addedApplication.id);
  }
  return updatedState;
};

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
      { ...state.applications[idx], ...updatedApplication },
      ...state.applications.slice(idx + 1),
    ],
  };
};

const onDeleteApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.deleteApplication>,
): ApplicationState => {
  const updatedState = {
    ...state,
    applications: state.applications.filter(application => application.id !== payload.applicationId),
  };
  if (state.draftApplicationId === payload.applicationId) {
    return setDraftApplication(updatedState, null);
  }
  return updatedState;
};

const onUpdateDraftApplication = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateDraftApplication>,
): ApplicationState => {
  return updateApplication(state, application => ({
    ...application,
    ...payload.application,
    settings: {
      ...(application.settings || { layerSettings: {} }),
      i18nSettings: { ...payload.i18nSettings },
      uiSettings: { ...payload.uiSettings },
    },
  }));
};

const onUpdateDraftApplicationValid = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateDraftApplicationValid>,
): ApplicationState => {
  return {
    ...state,
    draftApplicationValid: payload.isValid,
  };
};

const onAddApplicationTreeNodes = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.addApplicationTreeNodes>,
): ApplicationState => {
  return updateApplicationTree(state, payload.tree, (application, tree) => {
    return ApplicationModelHelper.addNodesToApplicationTree(application, tree, payload);
  }, false, getExpandableTreeNodes(payload.treeNodes));
};

const onAddApplicationRootNodes = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.addApplicationRootNodes>,
): ApplicationState => {
  return updateApplicationTree(state, payload.tree, (application, tree) => {
    return ApplicationModelHelper.addNodesToApplicationTree(application, tree, payload);
  }, true, getExpandableTreeNodes(payload.treeNodes));
};

const onUpdateApplicationTreeNode = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeNode>,
): ApplicationState => {
  return updateApplicationTree(state, payload.tree, (application, tree) => {
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
  return updateApplicationTree(state, payload.tree, (application, tree) => {
    const node = tree.find(n => n.id === payload.nodeId);
    if (!node) {
      return tree;
    }
    const nodesToRemove = new Set(ApplicationModelHelper.getChildNodes(tree, node).map(n => n.id));
    nodesToRemove.add(node.id);
    const updatedTree = tree.filter(n => !nodesToRemove.has(n.id));
    const [ parent, parentIdx ] = ApplicationModelHelper.getParent(updatedTree, payload.parentId);
    if (!parent) {
      return updatedTree;
    }
    const updatedParent = { ...parent, childrenIds: parent.childrenIds.filter(id => id !== payload.nodeId) };
    return [
      ...updatedTree.slice(0, parentIdx),
      updatedParent,
      ...updatedTree.slice(parentIdx + 1),
    ];
  });
};

export const onUpdateApplicationTreeOrder = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeOrder>,
): ApplicationState => {
  return updateApplicationTree(state, payload.tree, (application, tree) => {
    return ApplicationModelHelper.updateApplicationOrder(application, tree, payload);
  });
};

export const onUpdateApplicationTreeNodeVisibility = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationTreeNodeVisibility>,
): ApplicationState => {
  const visibilityChanged = new Map<string, boolean>(payload.visibility.map(v => [ v.nodeId, v.visible ]));
  return updateApplicationTree(state, payload.tree, (_, tree) => {
    return tree.map((node): AppTreeLayerNodeModel | AppTreeNodeModel => {
      if (ApplicationModelHelper.isLayerTreeNode(node) && visibilityChanged.has(node.id)) {
        return { ...node, visible: !!visibilityChanged.get(node.id) };
      }
      return node;
    });
  });
};

const onUpdateApplicationNodeSettings = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationNodeSettings>,
): ApplicationState => {
  return updateApplication(state, application => {
    const updatedSettings = {
      ...application.settings?.layerSettings || {},
      [payload.nodeId]: {
        ...application.settings?.layerSettings?.[payload.nodeId] || {},
        ...payload.settings || {},
      },
    };
    if (!payload.settings) {
      delete updatedSettings[payload.nodeId];
    }
    return {
      settings: {
        ...application.settings,
        layerSettings: updatedSettings,
      },
    };
  });
};

const onUpdateApplicationComponentConfig = (state: ApplicationState, payload: ReturnType<typeof ApplicationActions.updateApplicationComponentConfig>): ApplicationState => {
  return updateApplication(state, application => {
    const components = application.components || [];
    const componentIdx = components.findIndex(component => component.type === payload.componentType);
    const componentConfig: ComponentModel = {
        type: payload.componentType,
        config: payload.config,
    };
    if (componentIdx === -1) {
      return { components: [ ...components, componentConfig ] };
    }
    return {
      components: [
        ...components.slice(0, componentIdx),
        componentConfig,
        ...components.slice(componentIdx + 1),
      ],
    };
  });
};

const onUpdateApplicationStylingConfig = (state: ApplicationState, payload: ReturnType<typeof ApplicationActions.updateApplicationStylingConfig>): ApplicationState => {
  return updateApplication(state, application => {
    return {
      styling: {
        ...application.styling,
        ...payload.styling,
      },
    };
  });
};

const onUpdateApplicationFiltersConfig = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.updateApplicationFiltersConfig>,
): ApplicationState => {
  return updateApplication(state, application => ({
    settings: {
      ...application.settings,
      layerSettings: application.settings?.layerSettings || {}, // Ensure layerSettings is defined
      filterGroups: payload.filterGroups,
    },
  }));
};

const onCreateApplicationFilterGroup = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.createApplicationFilterGroup>,
): ApplicationState => {
  return updateApplication(state, application => ({
    settings: {
      ...application.settings,
      layerSettings: application.settings?.layerSettings || {}, // Ensure layerSettings is defined
      filterGroups: [ ...application.settings?.filterGroups ?? [], payload.filterGroup ],
    },
  }));
};

const onDeleteApplicationFilterGroup = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.deleteApplicationFilterGroup>,
): ApplicationState => {
  return updateApplication(state, application => {
    const filterGroups = application.settings?.filterGroups?.filter(filterGroup => {
      for (const filter of filterGroup.filters) {
        if (filter.id === payload.filterId) {
          return false;
        }
      }
      return true;
    }) || [];
      return {
        settings: {
          ...application.settings,
          layerSettings: application.settings?.layerSettings || {}, // Ensure layerSettings is defined
          filterGroups: filterGroups,
        },
      };
    });
};

const onToggleNodeExpanded = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.toggleApplicationNodeExpanded>,
): ApplicationState => {
  if (payload.tree === 'terrainLayer') {
    return state;
  }
  const expandedNodesList: 'expandedAppLayerNodes' | 'expandedBaseLayerNodes' = payload.tree === 'baseLayer'
    ? 'expandedBaseLayerNodes'
    : 'expandedAppLayerNodes';
  const list = state[expandedNodesList];
  const idx = list.indexOf(payload.nodeId);
  const updatedList = idx === -1
    ? [ ...list, payload.nodeId ]
    : [ ...list.slice(0, idx), ...list.slice(idx + 1) ];
  return {
    ...state,
    [expandedNodesList]: updatedList,
  };
};

const onToggleNodeExpandedAll = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.toggleApplicationNodeExpandedAll>,
): ApplicationState => {
  if (!state.draftApplication || payload.tree === 'terrainLayer') {
    return state;
  }
  const expandedNodesList: 'expandedAppLayerNodes' | 'expandedBaseLayerNodes' = payload.tree === 'baseLayer'
    ? 'expandedBaseLayerNodes'
    : 'expandedAppLayerNodes';
  const tree: 'baseLayerNodes' | 'layerNodes' = payload.tree === 'baseLayer' ? 'baseLayerNodes' : 'layerNodes';
  const contentRoot = ApplicationModelHelper.getApplicationContentRoot(state.draftApplication);
  const updatedList = payload.expandCollapse === 'collapse'
    ? []
    : getExpandableTreeNodes(contentRoot[tree]);
  return {
    ...state,
    [expandedNodesList]: updatedList,
  };
};

const onSetApplicationCatalogFilterTerm = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.setApplicationCatalogFilterTerm>,
): ApplicationState  => ({
  ...state,
  applicationCatalogFilterTerm: payload.filterTerm || undefined,
});

const onSetApplicationTreeFilterTerm = (
  state: ApplicationState,
  payload: ReturnType<typeof ApplicationActions.setApplicationTreeFilterTerm>,
): ApplicationState  => {
  if (payload.tree === 'terrainLayer') {
    return state;
  }
  const filterKey: keyof ApplicationState = payload.tree === 'baseLayer'
    ? 'applicationBaseLayerTreeFilterTerm'
    : 'applicationLayerTreeFilterTerm';
  return {
    ...state,
    [filterKey]: payload.filterTerm || undefined,
  };
};

const applicationReducerImpl = createReducer<ApplicationState>(
  initialApplicationState,
  on(ApplicationActions.loadApplicationsStart, onLoadApplicationStart),
  on(ApplicationActions.loadApplicationsSuccess, onLoadApplicationsSuccess),
  on(ApplicationActions.loadApplicationsFailed, onLoadApplicationsFailed),
  on(ApplicationActions.setApplicationListFilter, onSetApplicationListFilter),
  on(ApplicationActions.setSelectedApplication, onSetSelectedApplication),
  on(ApplicationActions.clearSelectedApplication, onClearSelectedApplication),
  on(ApplicationActions.addApplication, onAddApplication),
  on(ApplicationActions.updateApplication, onUpdateApplication),
  on(ApplicationActions.deleteApplication, onDeleteApplication),
  on(ApplicationActions.updateDraftApplication, onUpdateDraftApplication),
  on(ApplicationActions.updateDraftApplicationValid, onUpdateDraftApplicationValid),
  on(ApplicationActions.addApplicationTreeNodes, onAddApplicationTreeNodes),
  on(ApplicationActions.addApplicationRootNodes, onAddApplicationRootNodes),
  on(ApplicationActions.updateApplicationTreeNode, onUpdateApplicationTreeNode),
  on(ApplicationActions.removeApplicationTreeNode, onRemoveApplicationTreeNode),
  on(ApplicationActions.updateApplicationTreeOrder, onUpdateApplicationTreeOrder),
  on(ApplicationActions.updateApplicationTreeNodeVisibility, onUpdateApplicationTreeNodeVisibility),
  on(ApplicationActions.updateApplicationNodeSettings, onUpdateApplicationNodeSettings),
  on(ApplicationActions.updateApplicationComponentConfig, onUpdateApplicationComponentConfig),
  on(ApplicationActions.updateApplicationStylingConfig, onUpdateApplicationStylingConfig),
  on(ApplicationActions.updateApplicationFiltersConfig, onUpdateApplicationFiltersConfig),
  on(ApplicationActions.createApplicationFilterGroup, onCreateApplicationFilterGroup),
  on(ApplicationActions.deleteApplicationFilterGroup, onDeleteApplicationFilterGroup),
  on(ApplicationActions.toggleApplicationNodeExpanded, onToggleNodeExpanded),
  on(ApplicationActions.toggleApplicationNodeExpandedAll, onToggleNodeExpandedAll),
  on(ApplicationActions.setApplicationCatalogFilterTerm, onSetApplicationCatalogFilterTerm),
  on(ApplicationActions.setApplicationTreeFilterTerm, onSetApplicationTreeFilterTerm),
);
export const applicationReducer = (state: ApplicationState | undefined, action: Action) => applicationReducerImpl(state, action);
