import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  AuthenticatedUserService, LoginConfigurationModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel,
  UserResponseModel,
} from '@tailormap-viewer/api';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'tm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {

  public login$ = (username: string, password: string) => this.api.login$(username, password);
  public loginConfiguration$: Observable<LoginConfigurationModel>;
  public routeBeforeLogin: string | undefined;
  public insufficientRightsMessage: string | undefined;

  constructor(
    private store$: Store,
    private router: Router,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
    private authenticatedUserService: AuthenticatedUserService,
    private dialog: MatDialog,
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
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
    this.router.navigateByUrl(this.routeBeforeLogin || '/');
    this.authenticatedUserService.setUserDetails($event);
  }

}
