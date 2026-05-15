import { DestroyRef, inject } from '@angular/core';
import { Route, Router, RoutesRecognized } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

/**
 * This class allows other modules to register extra admin child routes
 * Because the admin bundle is lazy loaded, the routes are not available when 'booting' the module
 *
 * On RoutesRecognized, which is the first event that is triggered once the routing is loaded and ready
 * we check if we are in the admin route yet and if so we register the routes.
 *
 * NOTE: Because the admin bundle is lazy loaded, for this to work we use an internal Angular api: _loadedRoutes
 * See also https://github.com/angular/angular/issues/52416
 */
export class AdminRouterService {

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private registeredRoutes: Array<{ label: string; route: Route }> = [];
  private hasRegisteredRoutes = false;

  protected subroute: string = '';

  constructor() {
    const router = this.router;
    router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((e): e is RoutesRecognized => e instanceof RoutesRecognized),
      )
      .subscribe(e => {
        const newRoutes = this.activateRegisteredRoutes();
        const routePrefix = this.subroute ? `admin/${this.subroute}/` : 'admin/';
        if (newRoutes.length > 0 && newRoutes.some(r => r.path && e.url.includes(routePrefix + r.path))) {
          // If this route was just added we need to 'navigateByUrl' to this url to make sure the router knows about the new route
          this.router.navigateByUrl(e.url);
        }
      });
  }

  public registerRoute(label: string, route: Route) {
    this.registeredRoutes.push({ label, route });
    this.hasRegisteredRoutes = true;
  }

  public getRegisteredRoutes() {
    return this.registeredRoutes;
  }

  public activateRegisteredRoutes() {
    if (!this.hasRegisteredRoutes) {
      return [];
    }
    // Using the internal Angular _loadedRoutes property we find the admin route and the children of the admin route
    const currentConfig: Array<Route & { _loadedRoutes?: Route[] }> = this.router.config;
    const adminRoute = (currentConfig.find(r => r.path === 'admin')?._loadedRoutes || [])[0];
    if (adminRoute && adminRoute.children) {
      const parentRoute = this.subroute ? adminRoute.children.find(c => c.path === this.subroute) : adminRoute;
      if (parentRoute && parentRoute.children) {
        const children = parentRoute.children;
        const existingRoutes = new Set(children.map(c => c.path));
        // Filter routes so we don't add new once all the time
        const newRoutes = this.registeredRoutes
          .map(r => r.route)
          .filter(r => !existingRoutes.has(r.path));
        if (newRoutes.length) {
          // Add new routes to Settings -> children
          children.push(...newRoutes);
          // Reset the router config
          this.router.resetConfig(currentConfig);
          // Reset flag
          this.hasRegisteredRoutes = false;
          return newRoutes;
        }
      }
      return [];
    }
    return [];
  }

}
