import { createAction, props } from '@ngrx/store';
import { AppLayerSettingsModel, ApplicationModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { TreeNodePosition } from '@tailormap-viewer/shared';
import { ComponentBaseConfigModel, ViewerStylingModel } from '@tailormap-viewer/api';

const applicationActionsPrefix = '[Application]';

export const loadApplications = createAction(
  `${applicationActionsPrefix} Load Applications`,
);

export const loadApplicationsStart = createAction(
  `${applicationActionsPrefix} Load Applications Start`,
);

export const loadApplicationsSuccess = createAction(
  `${applicationActionsPrefix}  Load Applications Success`,
  props<{ applications: ApplicationModel[] }>(),
);

export const loadApplicationsFailed = createAction(
  `${applicationActionsPrefix}  Load Applications Failed`,
  props<{ error?: string }>(),
);

export const setApplicationListFilter = createAction(
  `${applicationActionsPrefix} Set Application List Filter`,
  props<{ filter: string | null | undefined }>(),
);

export const setSelectedApplication = createAction(
  `${applicationActionsPrefix} Set Selected Application`,
  props<{ applicationId: string | null }>(),
);

export const clearSelectedApplication = createAction(
  `${applicationActionsPrefix} Clear Selected Application`,
);

export const addApplications = createAction(
  `${applicationActionsPrefix} Add Applications`,
  props<{ applications: ApplicationModel[] }>(),
);

export const updateApplication = createAction(
  `${applicationActionsPrefix} Update Application`,
  props<{ application: ApplicationModel }>(),
);

export const deleteApplication = createAction(
  `${applicationActionsPrefix} Delete Application`,
  props<{ applicationId: string }>(),
);

export const updateDraftApplication = createAction(
  `${applicationActionsPrefix} Update Draft Application`,
  props<{ application: Omit<ApplicationModel, 'id'> }>(),
);

export const addApplicationTreeNodes = createAction(
  `${applicationActionsPrefix} Add Application Tree Nodes`,
  props<{
    treeNodes: AppTreeNodeModel[];
    tree: 'layer' | 'baseLayer';
    parentId?: string;
    position?: TreeNodePosition;
    sibling?: string;
  }>(),
);

export const addApplicationRootNodes = createAction(
  `${applicationActionsPrefix} Add Application Root Nodes`,
  props<{
    treeNodes: AppTreeNodeModel[];
    tree: 'layer' | 'baseLayer';
  }>(),
);

export const updateApplicationTreeOrder = createAction(
  `${applicationActionsPrefix} Update Application Tree Order`,
  props<{
    nodeId: string;
    tree: 'layer' | 'baseLayer';
    parentId?: string;
    position: TreeNodePosition;
    sibling?: string;
  }>(),
);

export const updateApplicationTreeNode = createAction(
  `${applicationActionsPrefix} Update Application Tree Node`,
  props<{ nodeId: string; updatedNode: Partial<AppTreeNodeModel>; tree: 'layer' | 'baseLayer' }>(),
);

export const removeApplicationTreeNode = createAction(
  `${applicationActionsPrefix} Remove Application Tree Node`,
  props<{ nodeId: string; parentId: string | null; tree: 'layer' | 'baseLayer' }>(),
);

export const updateApplicationTreeNodeVisibility = createAction(
  `${applicationActionsPrefix} Update Application Tree Node Visibility`,
  props<{
    tree: 'layer' | 'baseLayer';
    visibility: Array<{ nodeId: string; visible: boolean }>;
  }>(),
);

export const updateApplicationNodeSettings = createAction(
  `${applicationActionsPrefix} Update Application Node Settings`,
  props<{ nodeId: string; settings: AppLayerSettingsModel | null }>(),
);

export const loadApplicationServices = createAction(
  `${applicationActionsPrefix} Load Application Services`,
);

export const loadApplicationServicesSuccess = createAction(
  `${applicationActionsPrefix} Load Application Services Success`,
);

export const updateApplicationComponentConfig = createAction(
  `${applicationActionsPrefix} Update component config`,
  props<{ componentType: string; config: ComponentBaseConfigModel }>(),
);

export const updateApplicationStylingConfig = createAction(
  `${applicationActionsPrefix} Update styling config`,
  props<{ styling: ViewerStylingModel }>(),
);
