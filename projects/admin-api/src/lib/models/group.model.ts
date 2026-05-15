import { AdditionalPropertyModel } from './additional-property.model';

export interface GroupOidcInfoModel {
  clientIds: string[];
  lastSeenByClientId: { [clientId: string]: string };
}

export interface GroupModel {
  name: string;
  description?: string | null;
  aliasForGroup?: string | null;
  notes?: string | null;
  systemGroup?: boolean;
  version?: number | null;
  additionalProperties?: AdditionalPropertyModel[];
  oidcInfo?: GroupOidcInfoModel | null;
}
