import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Routes } from '../../../routes';
import { Observable, of, take } from 'rxjs';
import { ApplicationFeature, ApplicationFeatureSwitchService, SecurityModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

interface ButtonProps {
  icon?: string;
  label: string;
  link: string[];
  subMenu?: ButtonProps[];
  matchExact: boolean;
  requireAdmin: boolean;
  checkEnabled$?: Observable<boolean>;
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
    {
      label: $localize`:@@admin-core.navigation.home:Home`,
      matchExact: true,
      link: [ '/admin', Routes.ADMIN_HOME ],
      icon: 'admin_home',
      requireAdmin: false,
    },
    {
      label: $localize`:@@admin-core.navigation.catalog:Catalog`,
      matchExact: false,
      link: [ '/admin', Routes.CATALOG ],
      icon: 'admin_catalog',
      requireAdmin: true,
    },
    {
      label: $localize`:@@admin-core.navigation.forms:Forms`,
      matchExact: false,
      link: [ '/admin', Routes.FORMS ],
      icon: 'admin_form',
      requireAdmin: true,
    },
    {
      label: $localize`:@@admin-core.navigation.search-indexes:Search indexes`,
      matchExact: false,
      link: [ '/admin', Routes.SEARCH_INDEXES ],
      icon: 'admin_search-index',
      requireAdmin: true,
      checkEnabled$: this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.SEARCH_INDEX),
    },
    {
      label: $localize`:@@admin-core.navigation.users:Users`,
      matchExact: false,
      link: [ '/admin', Routes.USER ],
      icon: 'admin_user',
      requireAdmin: true,
    },
    {
      label: $localize`:@@admin-core.navigation.groups:Groups`,
      matchExact: false,
      link: [ '/admin', Routes.GROUP ],
      icon: 'admin_groups',
      requireAdmin: true,
    },
    // eslint-disable-next-line max-len
    {
      label: $localize`:@@admin-core.navigation.applications:Applications`,
      matchExact: false,
      link: [ '/admin', Routes.APPLICATION ],
      icon: 'admin_application',
      requireAdmin: true,
    },
  ];

  public bottomButtons: ButtonProps[] =  [
    {
      label: $localize`:@@admin-core.navigation.tasks:Tasks`,
      matchExact: false,
      link: [ '/admin', Routes.TASKS ],
      icon: 'admin_tasks',
      requireAdmin: true,
    },
    {
      label: $localize`:@@admin-core.navigation.logs:Logs`,
      matchExact: true,
      link: [ '/admin', Routes.LOGS ],
      icon: 'admin_logs',
      requireAdmin: true,
    },
    {
      label: $localize`:@@admin-core.navigation.settings:Settings`,
      matchExact: false,
      link: [ '/admin', Routes.SETTINGS ],
      icon: 'settings',
      requireAdmin: true,
    },
  ];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authenticatedUserService: AuthenticatedUserService,
    private applicationFeatureSwitchService: ApplicationFeatureSwitchService,
  ) {}

  public ngOnInit(): void {
    this.userDetails$ = this.authenticatedUserService.getUserDetails$();
  }

  public getButtonProps(button: ButtonProps): ButtonProps {
    return button as ButtonProps;
  }

  public logout() {
    this.authenticatedUserService.logout$()
      .pipe(take(1))
      .subscribe(loggedOut => {
        if (loggedOut) {
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
