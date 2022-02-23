export interface SecurityModel {
  loggedIn: boolean;
  user?: {
    username?: string;
  }
}
