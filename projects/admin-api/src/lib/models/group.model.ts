export interface GroupModel {
  // needed to make the model work with the admin-api,
  // we need the _links.self.href property of each group
  _links?: any;
  name: string;
  description?: string | null;
  notes?: string | null;
  systemGroup?: boolean;
  version?: number | null;
}
