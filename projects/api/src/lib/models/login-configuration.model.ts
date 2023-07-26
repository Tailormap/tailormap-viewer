export interface SSOLinkModel {
  name: string;
  url: string;
  showForViewer: boolean;
}

export interface LoginConfigurationModel {
  hideLoginForm: boolean;
  ssoLinks: SSOLinkModel[];
}
