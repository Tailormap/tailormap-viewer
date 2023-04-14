import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { selectRouteBeforeLogin } from '../../state/admin-core.selectors';
import { setLoginDetails, setRouteBeforeLogin } from '../../state/admin-core.actions';
import { TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel, UserResponseModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-login-page',
  templateUrl: './admin-login-page.component.html',
  styleUrls: ['./admin-login-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {

  public login$ = (username: string, password: string) => this.api.login$(username, password);

  constructor(
    private store$: Store,
    private router: Router,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) { }

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
