import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { map, Observable, take } from 'rxjs';
import { selectRouteBeforeLogin, selectUserWithInsufficientRights } from '../../state/admin-core.selectors';
import { setLoginDetails, setRouteBeforeLogin } from '../../state/admin-core.actions';
import { LoginConfigurationModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel, UserResponseModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-login-page',
  templateUrl: './admin-login-page.component.html',
  styleUrls: ['./admin-login-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {

  public login$ = (username: string, password: string) => this.api.login$(username, password);
  public loginConfiguration$: Observable<LoginConfigurationModel>;
  public routeBeforeLogin$: Observable<string | undefined>;
  public insufficientRightsMessage$: Observable<string | undefined>;

  constructor(
    private store$: Store,
    private router: Router,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {
    this.loginConfiguration$ = this.api.getLoginConfiguration$();
    this.routeBeforeLogin$ = this.store$.select(selectRouteBeforeLogin);
    this.insufficientRightsMessage$ = this.store$.select(selectUserWithInsufficientRights)
      .pipe(map(user => {
        if (user) {
          return $localize `You are logged in as ${user} but do not have proper roles to access administration. Please contact your administrator.`;
        }
        return undefined;
      }));
  }

  public loggedIn($event: UserResponseModel) {
    this.store$.select(selectRouteBeforeLogin)
      .pipe(take(1))
      .subscribe(beforeLoginUrl => {
        this.router.navigateByUrl(beforeLoginUrl || '/');
        this.store$.dispatch(setRouteBeforeLogin({ route: '' }));
        this.store$.dispatch(setLoginDetails($event));
      });
  }

}
