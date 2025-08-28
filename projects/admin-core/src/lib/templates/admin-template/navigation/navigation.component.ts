import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { Routes } from '../../../routes';
import { Observable, of, take } from 'rxjs';
import { ApplicationFeature, ApplicationFeatureSwitchService, AuthenticatedUserService, SecurityModel } from '@tailormap-viewer/api';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { NavigationButtonPropsModel } from '../../models/navigation-button-props.model';
import { AdminNavigationService, NavigationButtonWithPositionModel } from '../../admin-navigation.service';

@Component({
  selector: 'tm-admin-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NavigationComponent implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private applicationFeatureSwitchService = inject(ApplicationFeatureSwitchService);
  private adminNavigationService = inject(AdminNavigationService);


  public userDetails$: Observable<SecurityModel | null> = of(null);

  private readonly initialTopButtons: NavigationButtonPropsModel[] = [
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
    {
      label: $localize`:@@admin-core.navigation.applications:Applications`,
      matchExact: false,
      link: [ '/admin', Routes.APPLICATION ],
      icon: 'admin_application',
      requireAdmin: true,
    },
  ];

  private readonly initialBottomButtons: NavigationButtonPropsModel[] = [
    {
      label: $localize`:@@admin-core.navigation.tasks:Tasks`,
      matchExact: false,
      link: [ '/admin', Routes.TASKS ],
      icon: 'admin_tasks',
      requireAdmin: true,
      checkEnabled$: this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.TASKS),
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

  public buttons = signal<NavigationButtonPropsModel[]>(this.initialTopButtons);
  public bottomButtons = signal<NavigationButtonPropsModel[]>(this.initialBottomButtons);

  constructor() {
    effect(() => {
      const registeredButtons = this.adminNavigationService.registeredButtons();
      this.buttons.set(this.getButtons(registeredButtons, 'top'));
      this.bottomButtons.set(this.getButtons(registeredButtons, 'bottom'));
    });
  }

  private getButtons(
    registeredButtons: NavigationButtonWithPositionModel[],
    position: 'top' | 'bottom',
  ): NavigationButtonPropsModel[] {
    const buttons = [...position === 'top' ? this.initialTopButtons : this.initialBottomButtons];
    registeredButtons
      .filter(button => button.position === position)
      .forEach(button => {
        if (button.index !== undefined && button.index >= 0 && button.index < buttons.length) {
          buttons.splice(button.index, 0, button);
        } else {
          buttons.push(button);
        }
      });
    return buttons;
  }

  public ngOnInit(): void {
    this.userDetails$ = this.authenticatedUserService.getUserDetails$();
  }

  public getButtonProps(button: NavigationButtonPropsModel): NavigationButtonPropsModel {
    return button as NavigationButtonPropsModel;
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
