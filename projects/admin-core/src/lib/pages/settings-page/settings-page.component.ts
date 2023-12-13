import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Routes } from '../../routes';
import { AdminSettingsRouterService } from '../../settings/services/admin-settings-router.service';

@Component({
  selector: 'tm-admin-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  public submenuLinks = [
    {
      label: $localize `:@@admin-core.navigation.single-sign-on:Single-sign on`,
      matchExact: false,
      link: [ '/admin', Routes.SETTINGS, Routes.OIDC_CONFIGURATION ],
    },
  ];
  constructor(
    private adminSettingsRouterService: AdminSettingsRouterService,
  ) {
    this.adminSettingsRouterService.activateRegisteredRoutes();
  }
}
