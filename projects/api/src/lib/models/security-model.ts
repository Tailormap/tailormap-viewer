export interface SecurityPropertyModel {
  key: string;
  value: string | number | boolean;
}

export interface SecurityModel {
  isAuthenticated: boolean;
  username?: string;
  roles?: string[];
  properties?: SecurityPropertyModel[];
  groupProperties?: SecurityPropertyModel[];
}
