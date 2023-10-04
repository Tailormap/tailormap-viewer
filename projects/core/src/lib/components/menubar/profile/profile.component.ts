import { Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, OnInit, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/core.selectors';
import { Observable, of, Subject, take } from 'rxjs';
import {
  SecurityModel, TAILORMAP_SECURITY_API_V1_SERVICE,
  TailormapSecurityApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { setLoginDetails } from '../../../state/core.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {

  public userDetails$: Observable<SecurityModel | null> = of(null);
  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private router: Router,
    private cdr: ChangeDetectorRef,
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

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public logout() {
    this.api.logout$()
      .subscribe(loggedOut => {
        if (loggedOut) {
          this.store$.dispatch(setLoginDetails({ isAuthenticated: false }));
          window.location.reload();
        }
      });
  }

  public login() {
    this.router.navigateByUrl('/login', { state: { routeBeforeLogin: this.router.url } });
  }

}
