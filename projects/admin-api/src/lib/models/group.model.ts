export interface GroupModel {
  name: string;
  description?: string | null;
  notes?: string | null;
  systemGroup?: boolean;
  version?: number | null;
  additionalProperties?: Record<string, string | number | boolean> | null;
}
