import { UserState, userStateKey } from './user.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectUserState = createFeatureSelector<UserState>(userStateKey);

export const selectUsers = createSelector(selectUserState, state => state.users);
export const selectUsersLoadStatus = createSelector(selectUserState, state => state.usersLoadStatus);
export const selectUsersLoadError = createSelector(selectUserState, state => state.usersLoadError);
export const selectGroups = createSelector(selectUserState, state => state.groups);
export const selectGroupsLoadStatus = createSelector(selectUserState, state => state.groupsLoadStatus);
export const selectGroupsLoadError = createSelector(selectUserState, state => state.groupsLoadError);
