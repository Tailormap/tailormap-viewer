export interface SSOLinkModel {
  name: string;
  url: string;
}

export interface LoginConfigurationModel {
  hideLoginForm: boolean;
  ssoLinks: SSOLinkModel[];
}
