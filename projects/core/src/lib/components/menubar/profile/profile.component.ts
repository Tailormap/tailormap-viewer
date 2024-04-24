import { Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, OnInit, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectShowLanguageSwitcher, selectShowLoginButton, selectUserDetails, selectUserIsAdmin } from '../../../state/core.selectors';
import { combineLatest, map, Observable, Subject, take } from 'rxjs';
import {
  SecurityModel, TAILORMAP_SECURITY_API_V1_SERVICE,
  TailormapSecurityApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { setLoginDetails } from '../../../state/core.actions';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {

  public showLanguageToggle$: Observable<boolean>;
  public userDetails$: Observable<SecurityModel | null>;
  public userIsAdmin$: Observable<boolean>;
  public showLoginButton$: Observable<boolean>;
  public icon$: Observable<string>;

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {
    this.userDetails$ = this.store$.select(selectUserDetails);
    this.userIsAdmin$ = this.store$.select(selectUserIsAdmin);
    this.showLanguageToggle$ = this.store$.select(selectShowLanguageSwitcher);
    this.showLoginButton$ = this.store$.select(selectShowLoginButton);
    this.icon$ = combineLatest([
      this.userDetails$,
      this.showLoginButton$,
    ]).pipe(map(([ userDetails, showLoginButton ]) => {
      if (userDetails?.isAuthenticated) {
        return 'user';
      }
      return showLoginButton ? 'login' : 'settings';
    }));
  }

  public ngOnInit() {
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

  public showAbout() {
    AboutDialogComponent.open(this.dialog);
  }

}
