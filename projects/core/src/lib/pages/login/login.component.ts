import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthenticatedUserService, LoginConfigurationModel, TAILORMAP_SECURITY_API_V1_SERVICE,
  UserResponseModel,
} from '@tailormap-viewer/api';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';

export interface RouterNavigationState {
  hasInsufficientRights?: boolean;
  userName?: string;
  routeBeforeLogin?: string;
}

@Component({
  selector: 'tm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LoginComponent implements OnInit {
  private api = inject(TAILORMAP_SECURITY_API_V1_SERVICE);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private dialog = inject(MatDialog);
  private location = inject(Location);


  public login$ = (username: string, password: string) => this.api.login$(username, password);
  public requestPasswordReset$ = (email: string):Observable<boolean> => this.api.requestPasswordReset$(email);
  public loginConfiguration$: Observable<LoginConfigurationModel>;
  public routeBeforeLogin: string | undefined;
  public insufficientRightsMessage: string | undefined;
  public showPasswordResetForm = false;

  constructor() {
    const routerState = this.location.getState();
    const state: RouterNavigationState = this.isRouterNavigationState(routerState) ? routerState : {};
    this.loginConfiguration$ = this.api.getLoginConfiguration$();
    this.routeBeforeLogin = state ? state['routeBeforeLogin'] : undefined;
    const userLabel = state ? $localize `:@@core.login.as:as ${state['userName']}` : '';
    this.insufficientRightsMessage = state && state['hasInsufficientRights']
      // eslint-disable-next-line max-len
      ? $localize `:@@core.login.insufficient-rights-error:You are logged in ${userLabel} but do not have proper roles to access the application. Please contact your administrator.`
      : undefined;
  }

  public ngOnInit() {
    this.dialog.closeAll();
  }

  public loggedIn($event: UserResponseModel) {
    this.authenticatedUserService.setUserDetails($event);
    window.location.href = this.routeBeforeLogin || '/';
  }

  public onRequestPasswordReset() {
    this.showPasswordResetForm = true;
  }

  private isRouterNavigationState(obj: unknown): obj is RouterNavigationState {
    // check if obj is an object
    if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
      return ('routeBeforeLogin' in obj || 'hasInsufficientRights' in obj);
    }
    return false;
  }

}
