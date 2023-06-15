import * as UserActions from './user.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { UserState, initialUserState } from './user.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadUsersStart = (state: UserState): UserState => ({
  ...state,
  usersLoadStatus: LoadingStateEnum.LOADING,
  usersLoadError: undefined,
  users: [],
});

const onLoadUsersSuccess = (
  state: UserState,
  payload: ReturnType<typeof UserActions.loadUsersSuccess>,
): UserState => ({
  ...state,
  usersLoadStatus: LoadingStateEnum.LOADED,
  usersLoadError: undefined,
  users: payload.users,
});

const onLoadUsersFailed = (
  state: UserState,
  payload: ReturnType<typeof UserActions.loadUsersFailed>,
): UserState => ({
  ...state,
  usersLoadStatus: LoadingStateEnum.FAILED,
  usersLoadError: payload.error,
  users: [],
});

const onLoadGroupsStart = (state: UserState): UserState => ({
  ...state,
  groupsLoadStatus: LoadingStateEnum.LOADING,
  groupsLoadError: undefined,
  groups: [],
});

const onLoadGroupsSuccess = (
  state: UserState,
  payload: ReturnType<typeof UserActions.loadGroupsSuccess>,
): UserState => ({
  ...state,
  groupsLoadStatus: LoadingStateEnum.LOADED,
  groupsLoadError: undefined,
  groups: payload.groups,
});

const onLoadGroupsFailed = (
  state: UserState,
  payload: ReturnType<typeof UserActions.loadGroupsFailed>,
): UserState => ({
  ...state,
  groupsLoadStatus: LoadingStateEnum.FAILED,
  groupsLoadError: payload.error,
  groups: [],
});

const onAddUser = (
  state: UserState,
  payload: ReturnType<typeof UserActions.addUser>,
): UserState => {
  if (state.users.some(u => u.name === payload.user.name)) {
    return state;
  }
  return {
    ...state,
    users: [ ...state.users, payload.user ],
  };
};

const onUpdateUser = (
  state: UserState,
  payload: ReturnType<typeof UserActions.updateUser>,
): UserState => {
  const idx = state.users.findIndex(u => u.name === payload.user.name);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    users: [
      ...state.users.slice(0, idx),
      { ...state.users[idx], ...payload.user },
      ...state.users.slice(idx + 1),
    ],
  };
};

const onDeleteUser = (
  state: UserState,
  payload: ReturnType<typeof UserActions.deleteUser>,
): UserState => {
  const idx = state.users.findIndex(u => u.name === payload.userName);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    users: [
      ...state.users.slice(0, idx),
      ...state.users.slice(idx + 1),
    ],
  };
};

const onAddGroup = (
  state: UserState,
  payload: ReturnType<typeof UserActions.addGroup>,
): UserState => {
  if (state.groups.some(u => u.name === payload.group.name)) {
    return state;
  }
  return {
    ...state,
    groups: [ ...state.groups, payload.group ],
  };
};

const onUpdateGroup = (
  state: UserState,
  payload: ReturnType<typeof UserActions.updateGroup>,
): UserState => {
  const idx = state.groups.findIndex(u => u.name === payload.group.name);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    groups: [
      ...state.groups.slice(0, idx),
      { ...state.groups[idx], ...payload.group },
      ...state.groups.slice(idx + 1),
    ],
  };
};

const onDeleteGroup = (
  state: UserState,
  payload: ReturnType<typeof UserActions.deleteGroup>,
): UserState => {
  const idx = state.groups.findIndex(u => u.name === payload.groupName);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    groups: [
      ...state.groups.slice(0, idx),
      ...state.groups.slice(idx + 1),
    ],
  };
};

const userReducerImpl = createReducer<UserState>(
  initialUserState,
  on(UserActions.loadUsersStart, onLoadUsersStart),
  on(UserActions.loadUsersSuccess, onLoadUsersSuccess),
  on(UserActions.loadUsersFailed, onLoadUsersFailed),
  on(UserActions.loadGroupsStart, onLoadGroupsStart),
  on(UserActions.loadGroupsSuccess, onLoadGroupsSuccess),
  on(UserActions.loadGroupsFailed, onLoadGroupsFailed),
  on(UserActions.addUser, onAddUser),
  on(UserActions.updateUser, onUpdateUser),
  on(UserActions.deleteUser, onDeleteUser),
  on(UserActions.addGroup, onAddGroup),
  on(UserActions.updateGroup, onUpdateGroup),
  on(UserActions.deleteGroup, onDeleteGroup),
);
export const userReducer = (state: UserState | undefined, action: Action) => userReducerImpl(state, action);
