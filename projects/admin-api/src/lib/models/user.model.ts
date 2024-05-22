import { AdditionalPropertyModel } from './additional-property.model';

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
  groupNames: string[] | null;
  additionalProperties?: AdditionalPropertyModel[] | null;
}
