import { AdditionalPropertyModel } from './additional-property.model';

export interface GroupModel {
  name: string;
  description?: string | null;
  notes?: string | null;
  systemGroup?: boolean;
  version?: number | null;
  additionalProperties?: AdditionalPropertyModel[];
}
