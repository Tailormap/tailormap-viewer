import { GroupModel } from './group.model';

export interface UserModel {
  username: string;
  // should not be sent from the API
  password?: string;
  email: string | null;
  enabled: boolean;
  name: string | null;
  notes?: string | null;
  validUntil: Date | null;
  version?: number | null;
  groups: GroupModel[] | null;
  additionalProperties?: Record<string, any> | null;
}
