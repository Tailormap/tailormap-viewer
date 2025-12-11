export interface SecurityPropertyModel {
  key: string;
  value: string | number | boolean;
}

export interface SecurityModel {
  isAuthenticated: boolean;
  username?: string;
  organisation?: string | null;
  roles?: string[];
  properties?: SecurityPropertyModel[];
  groupProperties?: SecurityPropertyModel[];
}
