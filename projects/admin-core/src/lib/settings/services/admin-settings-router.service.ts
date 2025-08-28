import { Injectable } from '@angular/core';
import { AdminRouterService } from '../../shared/services/admin-router.service';
import { Route } from '@angular/router';

/**
 * Specialized AdminRouterService to add routes as children of the Settings route.
 * See AdminRouterService for more information.
 */

@Injectable({
  providedIn: 'root',
})
export class AdminSettingsRouterService extends AdminRouterService {
  protected override subroute = 'settings';
  // Method kept for backwards compatibility
  public registerSettingsRoutes(label: string, route: Route) {
    this.registerRoute(label, route);
  }
}
