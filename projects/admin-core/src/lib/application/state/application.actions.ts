import { createAction, props } from '@ngrx/store';
import { ApplicationModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';

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

export const addApplicationTreeNodes = createAction(
  `${applicationActionsPrefix} Add Application Tree Nodes`,
  props<{ applicationId: string; treeNodes: AppTreeNodeModel[]; tree: 'layer' | 'baseLayer'; parentId?: string }>(),
);

export const updateApplicationTreeNode = createAction(
  `${applicationActionsPrefix} Update Application Tree Node`,
  props<{ applicationId: string; updatedNode: AppTreeNodeModel; tree: 'layer' | 'baseLayer' }>(),
);
