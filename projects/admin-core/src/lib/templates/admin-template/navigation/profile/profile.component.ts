import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, take } from 'rxjs';
import {
  SecurityModel, TAILORMAP_SECURITY_API_V1_SERVICE,
  TailormapSecurityApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { selectUserDetails } from '../../../../state/admin-core.selectors';
import { setLoginDetails, setRouteBeforeLogin } from '../../../../state/admin-core.actions';

@Component({
  selector: 'tm-admin-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {

  public userDetails$: Observable<SecurityModel | null> = of(null);
  public readonly loginLabel = $localize `Login`;

  constructor(
    private store$: Store,
    private router: Router,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {}

  public ngOnInit() {
    this.userDetails$ = this.store$.select(selectUserDetails);
    this.api.getUser$()
      .pipe(take(1))
      .subscribe(userDetails => {
        this.store$.dispatch(setLoginDetails(userDetails));
      });
  }

  public logout() {
    this.api.logout$()
      .pipe(take(1))
      .subscribe(loggedOut => {
        if (loggedOut) {
          this.store$.dispatch(setLoginDetails({ isAuthenticated: false }));
          this.router.navigateByUrl('/').then(() => {
            window.location.reload();
          });
        }
      });
  }

  public login() {
    this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
    this.router.navigateByUrl('/login');
  }

}
