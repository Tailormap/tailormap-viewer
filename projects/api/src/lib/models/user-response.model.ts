import { SecurityPropertyModel } from './security-model';

export interface UserResponseModel {
  isAuthenticated: boolean;
  username: string;
  roles: string[];
  properties: SecurityPropertyModel[];
  groupProperties: SecurityPropertyModel[];
}
