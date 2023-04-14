export interface SecurityModel {
  isAuthenticated: boolean;
  username?: string;
  roles?: string[];
}
