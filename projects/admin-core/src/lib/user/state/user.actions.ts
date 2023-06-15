import { createAction, props } from '@ngrx/store';
import { ApplicationModel, GroupModel, UserModel } from '@tailormap-admin/admin-api';

const userActionsPrefix = '[User]';

export const loadUsers = createAction(
  `${userActionsPrefix} Load Users`,
);

export const loadUsersStart = createAction(
  `${userActionsPrefix} Load Users Start`,
);

export const loadUsersSuccess = createAction(
  `${userActionsPrefix}  Load Users Success`,
  props<{ users: UserModel[] }>(),
);

export const loadUsersFailed = createAction(
  `${userActionsPrefix}  Load Users Failed`,
  props<{ error?: string }>(),
);

export const loadGroups = createAction(
  `${userActionsPrefix} Load Groups`,
);

export const loadGroupsStart = createAction(
  `${userActionsPrefix} Load Groups Start`,
);

export const loadGroupsSuccess = createAction(
  `${userActionsPrefix}  Load Groups Success`,
  props<{ groups: GroupModel[] }>(),
);

export const loadGroupsFailed = createAction(
  `${userActionsPrefix}  Load Groups Failed`,
  props<{ error?: string }>(),
);

export const addUser = createAction(
  `${userActionsPrefix} Add Users`,
  props<{ user: UserModel }>(),
);

export const updateUser = createAction(
  `${userActionsPrefix} Update User`,
  props<{ user: UserModel }>(),
);

export const deleteUser = createAction(
  `${userActionsPrefix} Delete User`,
  props<{ userName: string }>(),
);

export const addGroup = createAction(
  `${userActionsPrefix} Add Groups`,
  props<{ group: GroupModel }>(),
);

export const updateGroup = createAction(
  `${userActionsPrefix} Update Group`,
  props<{ group: GroupModel }>(),
);

export const deleteGroup = createAction(
  `${userActionsPrefix} Delete Group`,
  props<{ groupName: string }>(),
);
