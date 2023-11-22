import { Inject, LOCALE_ID, NgModule } from '@angular/core';
import { NavigationError, Router, RouterModule, Routes } from '@angular/router';
import { LoginComponent, ViewerAppComponent } from './pages';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [
  // IMPORTANT: When you add a route, also add it to the FrontController class of tailormap-api, otherwise a user will get a 404 when
  // pressing F5 in their browser on your route.
  { path: 'login', component: LoginComponent },
  { path: 'app/:name', component: ViewerAppComponent },
  { path: 'app', component: ViewerAppComponent },
  { path: 'service/:name', component: ViewerAppComponent },
  {
    path: 'admin',
    loadChildren: () => import('@tailormap-admin/admin-core').then(m => m.AdminCoreModule),
    title: 'Tailormap Admin',
  },
  { path: '', component: ViewerAppComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CoreRoutingModule {
  constructor(router: Router, @Inject(APP_BASE_HREF) baseHref: string, @Inject(LOCALE_ID) localeId: string) {
    // Use an alternative catch-all route instead of '**', this allows libraries to add routes
    router.events.pipe(
      takeUntilDestroyed(),
      filter((event): event is NavigationError => event instanceof NavigationError),
    ).subscribe((event: NavigationError) => {
      router.navigateByUrl(CoreRoutingModule.getErrorNavigationUrl(event.url, baseHref, localeId)); // We could navigate to route showing 404
    });
  }

  private static getErrorNavigationUrl(url: string, baseHref: string, localeId: string): string {
    const localeSuffix = `/${localeId}/`;
    // If the error URL starts with the base href but without the locale suffix, navigate to the part after that
    // Example: /some-base/app/myapp, but the base href is /some-base/en/, navigate to /app/myapp
    if(baseHref.endsWith(localeSuffix)) {
      const baseHrefWithoutLocaleSuffix = baseHref.substring(0, baseHref.length - localeSuffix.length);
      if (!url.startsWith(baseHrefWithoutLocaleSuffix)) {
        return url.substring(baseHrefWithoutLocaleSuffix.length);
      }
    }
    // Other route error URL, just go to /app/
    return '/app/';
  }
}
