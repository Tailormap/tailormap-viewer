import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { Routes } from '../../routes';
import { AdminSettingsRouterService } from '../../settings/services/admin-settings-router.service';

interface SubmenuLink {
  label: string;
  link: string[];
  matchExact: boolean;
}

@Component({
  selector: 'tm-admin-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SettingsPageComponent implements OnInit {
  private adminSettingsRouterService = inject(AdminSettingsRouterService);


  public submenuLinks: SubmenuLink[] = [];

  public ngOnInit() {
    this.adminSettingsRouterService.activateRegisteredRoutes();
    this.submenuLinks = this.adminSettingsRouterService.getRegisteredRoutes()
      .map(route => ({
        label: route.label,
        matchExact: false,
        link: [ '/admin', Routes.SETTINGS, (route.route.path || '') ],
      }));
  }

}
