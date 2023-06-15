import { GroupModel, UserModel } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

export const userStateKey = 'user';

export interface UserState {
  users: UserModel[];
  usersLoadStatus: LoadingStateEnum;
  usersLoadError?: string;
  groups: GroupModel[];
  groupsLoadStatus: LoadingStateEnum;
  groupsLoadError?: string;
}

export const initialUserState: UserState = {
  users: [],
  usersLoadStatus: LoadingStateEnum.INITIAL,
  groups: [],
  groupsLoadStatus: LoadingStateEnum.INITIAL,
};
