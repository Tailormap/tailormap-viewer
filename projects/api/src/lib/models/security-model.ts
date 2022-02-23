interface SecurityUserModel {
  username?: string;
}

export interface SecurityModel {
  loggedIn: boolean;
  user?: SecurityUserModel;
}
