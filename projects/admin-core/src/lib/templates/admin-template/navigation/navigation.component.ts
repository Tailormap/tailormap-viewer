import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Routes } from '../../../routes';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/admin-core.selectors';
import { Observable, of, take } from 'rxjs';
import { SecurityModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { setLoginDetails } from '../../../state/admin-core.actions';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';

interface ButtonProps {
  icon?: string;
  label: string;
  link: string[];
  subMenu?: ButtonProps[];
  matchExact: boolean;
  requireAdmin: boolean;
}

@Component({
  selector: 'tm-admin-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit {

  public userDetails$: Observable<SecurityModel | null> = of(null);

  public buttons: ButtonProps[] =  [
    { label: $localize `:@@admin-core.navigation.home:Home`, matchExact: true, link: [ '/admin', Routes.ADMIN_HOME ], icon: 'admin_home', requireAdmin: false },
    { label: $localize `:@@admin-core.navigation.catalog:Catalog`, matchExact: false, link: [ '/admin', Routes.CATALOG ], icon: 'admin_catalog', requireAdmin: true },
    { label: $localize `:@@admin-core.navigation.forms:Forms`, matchExact: false, link: [ '/admin', Routes.FORMS ], icon: 'admin_form', requireAdmin: true },
    // eslint-disable-next-line max-len
    { label: $localize `:@@admin-core.navigation.search-indexes:Search indexes`, matchExact: false, link: [ '/admin', Routes.SEARCH_INDEXES ], icon: 'admin_search-index', requireAdmin: true },
    { label: $localize `:@@admin-core.navigation.users:Users`, matchExact: false, link: [ '/admin', Routes.USER ], icon: 'admin_user', requireAdmin: true },
    { label: $localize `:@@admin-core.navigation.groups:Groups`, matchExact: false, link: [ '/admin', Routes.GROUP ], icon: 'admin_groups', requireAdmin: true },
    // eslint-disable-next-line max-len
    { label: $localize `:@@admin-core.navigation.applications:Applications`, matchExact: false, link: [ '/admin', Routes.APPLICATION ], icon: 'admin_application', requireAdmin: true },
  ];

  public bottomButtons: ButtonProps[] =  [
    { label: $localize `:@@admin-core.navigation.settings:Settings`, matchExact: false, link: [ '/admin', Routes.SETTINGS ], icon: 'settings', requireAdmin: true },
  ];

  constructor(
    private store$: Store,
    private router: Router,
    private dialog: MatDialog,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {}

  public ngOnInit(): void {
    this.userDetails$ = this.store$.select(selectUserDetails);
    this.api.getUser$()
      .pipe(take(1))
      .subscribe(userDetails => {
        this.store$.dispatch(setLoginDetails(userDetails));
      });
  }

  public getButtonProps(button: ButtonProps): ButtonProps {
    return button as ButtonProps;
  }

  public logout() {
    this.api.logout$()
      .pipe(take(1))
      .subscribe(loggedOut => {
        if (loggedOut) {
          this.store$.dispatch(setLoginDetails({ isAuthenticated: false }));
          this.router.navigateByUrl('/admin').then(() => {
            window.location.reload();
          });
        }
      });
  }

  public login() {
    this.router.navigateByUrl('/login', { state: { routeBeforeLogin: this.router.url } });
  }

  public showAbout() {
    AboutDialogComponent.open(this.dialog);
  }

  public isAdmin(userDetails: SecurityModel) {
    return userDetails?.roles?.includes('admin');
  }

}
