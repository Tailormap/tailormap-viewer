import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthenticatedUserService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle, selectShowLoginButton } from '../../../../state';
import { combineLatest, map, Observable } from 'rxjs';
import { MenubarButtonComponent } from '../../menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-profile-menu-button',
    templateUrl: './profile-menu-button.component.html',
    styleUrls: ['./profile-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class ProfileMenuButtonComponent {
  private store$ = inject(Store);
  private authenticatedUserService = inject(AuthenticatedUserService);


  public componentType = BaseComponentTypeEnum.PROFILE;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.profile:Profile`));
  public icon$: Observable<string>;

  constructor() {
    this.icon$ = combineLatest([
      this.authenticatedUserService.getUserDetails$(),
      this.store$.select(selectShowLoginButton),
    ]).pipe(map(([ userDetails, showLoginButton ]) => {
      if (userDetails?.isAuthenticated) {
        return 'user';
      }
      return showLoginButton ? 'login' : 'settings';
    }));
  }
}
