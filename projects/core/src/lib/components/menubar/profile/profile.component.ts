import { Component, ChangeDetectionStrategy, OnDestroy, inject, OnInit, input, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectShowLanguageSwitcher, selectShowLoginButton } from '../../../state/core.selectors';
import { combineLatest, map, Observable, Subject } from 'rxjs';
import { BaseComponentTypeEnum, SecurityModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { ProfileMenuButtonComponent } from './profile-menu-button/profile-menu-button.component';
import { ComponentRegistrationService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenubarService } from '../menubar.service';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProfileComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private componentRegistrationService = inject(ComponentRegistrationService);
  private menubarService = inject(MenubarService);
  private mobileLayoutService = inject(MobileLayoutService);
  private destroyRef = inject(DestroyRef);

  public noExpansionPanel = input<boolean>(false);

  public showLanguageToggle$: Observable<boolean>;
  public userDetails$: Observable<SecurityModel | null>;
  public userIsAdmin$: Observable<boolean>;
  public showLoginButton$: Observable<boolean>;
  public icon$: Observable<string>;
  public visible$: Observable<boolean>;

  private destroyed = new Subject();

  constructor() {
    this.userDetails$ = this.authenticatedUserService.getUserDetails$();
    this.userIsAdmin$ = this.authenticatedUserService.isAdminUser$();
    this.showLanguageToggle$ = this.store$.select(selectShowLanguageSwitcher);
    this.showLoginButton$ = this.store$.select(selectShowLoginButton);
    this.visible$ = combineLatest([
      this.menubarService.isComponentVisible$(BaseComponentTypeEnum.PROFILE),
      this.mobileLayoutService.isMobileLayoutEnabled$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ visible, mobileLayoutEnabled ]) => visible || !mobileLayoutEnabled),
    );

    this.icon$ = combineLatest([
      this.userDetails$,
      this.showLoginButton$,
    ]).pipe(map(([ userDetails, showLoginButton ]) => {
      if (userDetails?.isAuthenticated) {
        return 'user';
      }
      return showLoginButton ? 'login' : 'settings';
    }));

    this.menubarService.isComponentVisible$(BaseComponentTypeEnum.PROFILE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visible => {
        if (visible) {
          this.menubarService.setMobilePanelHeight(255);
        }
      });
  }

  public ngOnInit(): void {
    this.componentRegistrationService.registerComponent('mobile-menu-home', { type: BaseComponentTypeEnum.PROFILE, component: ProfileMenuButtonComponent });
  }

  public ngOnDestroy() {
    this.componentRegistrationService.deregisterComponent('mobile-menu-home', BaseComponentTypeEnum.PROFILE);
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
