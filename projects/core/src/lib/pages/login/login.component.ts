import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { selectRouteBeforeLogin, selectUserWithInsufficientRights } from '../../state/core.selectors';
import { map, Observable, take } from 'rxjs';
import { setLoginDetails, setRouteBeforeLogin } from '../../state/core.actions';
import { LoginConfigurationModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel, UserResponseModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

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
          return $localize `You are logged in as ${user} but do not have proper roles to access the application. Please contact your administrator.`;
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
