import { UserModel } from '@tailormap-admin/admin-api';

export interface UserAddUpdateModel extends Omit<UserModel, 'groupNames'> {
  groups: string[];
}
