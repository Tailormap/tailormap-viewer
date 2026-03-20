export interface SSOLinkModel {
  name: string;
  url: string;
  showForViewer: boolean;
  image?: string;
}

export interface LoginConfigurationModel {
  hideLoginForm: boolean;
  ssoLinks: SSOLinkModel[];
  enablePasswordReset: boolean;
}

export interface RouterNavigationState {
  hasInsufficientRights?: boolean;
  userName?: string;
  routeBeforeLogin?: string;
}
