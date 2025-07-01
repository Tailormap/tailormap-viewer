import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectShowLanguageSwitcher, selectShowLoginButton } from '../../../state/core.selectors';
import { combineLatest, map, Observable, Subject } from 'rxjs';
import { SecurityModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProfileComponent implements OnDestroy {
  private store$ = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authenticatedUserService = inject(AuthenticatedUserService);


  public showLanguageToggle$: Observable<boolean>;
  public userDetails$: Observable<SecurityModel | null>;
  public userIsAdmin$: Observable<boolean>;
  public showLoginButton$: Observable<boolean>;
  public icon$: Observable<string>;

  private destroyed = new Subject();

  constructor() {
    this.userDetails$ = this.authenticatedUserService.getUserDetails$();
    this.userIsAdmin$ = this.authenticatedUserService.isAdminUser$();
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
