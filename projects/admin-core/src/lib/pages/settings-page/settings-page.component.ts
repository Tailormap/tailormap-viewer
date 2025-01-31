import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
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

  public submenuLinks: SubmenuLink[] = [];

  constructor(
    private adminSettingsRouterService: AdminSettingsRouterService,
  ) {}

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
