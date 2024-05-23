import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectShowLanguageSwitcher, selectShowLoginButton, selectUserDetails, selectUserIsAdmin } from '../../../state/core.selectors';
import { combineLatest, map, Observable, Subject } from 'rxjs';
import { SecurityModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatedUserService } from '../../../services/authenticated-user.service';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnDestroy {

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
    private authenticatedUserService: AuthenticatedUserService,
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

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public logout() {
    this.authenticatedUserService.logout$()
      .subscribe(loggedOut => {
        if (loggedOut) {
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
