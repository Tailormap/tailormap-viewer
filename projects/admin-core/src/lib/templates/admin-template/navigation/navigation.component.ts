import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Routes } from '../../../routes';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/admin-core.selectors';
import { map, Observable, of, take } from 'rxjs';
import { SecurityModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { setLoginDetails } from '../../../state/admin-core.actions';

interface ButtonProps {
  icon?: string;
  label: string;
  link: string[];
  subMenu?: ButtonProps[];
  matchExact: boolean;
  requireAdmin: boolean;
}

const availableButtons: ButtonProps[] = [
  { label: $localize `Home`, matchExact: true, link: [ '/admin', Routes.ADMIN_HOME ], icon: 'admin_home', requireAdmin: false },
  { label: $localize `Catalog`, matchExact: false, link: [ '/admin', Routes.CATALOG ], icon: 'admin_catalog', requireAdmin: true },
  { label: $localize `Users`, matchExact: false, link: [ '/admin', Routes.USER ], icon: 'admin_user', requireAdmin: true },
  { label: $localize `Groups`, matchExact: false, link: [ '/admin', Routes.GROUP ], icon: 'admin_groups', requireAdmin: true },
  { label: $localize `Applications`, matchExact: false, link: [ '/admin', Routes.APPLICATION ], icon: 'admin_application', requireAdmin: true },
  { label: $localize `Single-sign on`, matchExact: false, link: [ '/admin', Routes.OIDC_CONFIGURATION ], icon: 'key', requireAdmin: true },
];

@Component({
  selector: 'tm-admin-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit {

  public userDetails$: Observable<SecurityModel | null> = of(null);
  public buttons$: Observable<ButtonProps[]> = of([]);

  constructor(
    private store$: Store,
    private router: Router,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {}

  public ngOnInit(): void {
    this.buttons$ = this.store$.select(selectUserDetails)
      .pipe(
        map(userDetails => {
          const isAdmin = userDetails?.roles?.includes('admin') ?? false;
          return availableButtons.filter(button => isAdmin || !button.requireAdmin);
        }),
      );
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

}
