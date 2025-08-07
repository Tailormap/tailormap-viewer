import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { NavigationError, Router } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationErrorRouterService {
  private urlNavigatedToAfterError: string | null = null;

  constructor() {
    const router = inject(Router);
    const baseHref = inject(APP_BASE_HREF);
    const localeId = inject(LOCALE_ID);

    // Use an alternative catch-all route instead of '**', this allows libraries to add routes
    router.events.pipe(
      takeUntilDestroyed(),
      filter((event): event is NavigationError => event instanceof NavigationError),
    ).subscribe((event: NavigationError) => {
      console.error('Navigation error', event);
      const urlToNavigateTo = NavigationErrorRouterService.getErrorNavigationUrl(event.url, baseHref, localeId);
      if (urlToNavigateTo !== this.urlNavigatedToAfterError) {
        this.urlNavigatedToAfterError = urlToNavigateTo;
        router.navigateByUrl(this.urlNavigatedToAfterError); // We could navigate to route showing 404
      }
    });
  }

  public static getErrorNavigationUrl(url: string, baseHref: string, localeId: string): string {
    const localeSuffix = `/${localeId}/`;
    // If the error URL starts with the base href but without the locale suffix, navigate to the part after that
    // Example: /some-base/app/myapp, but the base href is /some-base/en/, navigate to /app/myapp
    if (baseHref.endsWith(localeSuffix)) {
      const baseHrefWithoutLocaleSuffix = baseHref.substring(0, baseHref.length - localeSuffix.length);
      if (baseHrefWithoutLocaleSuffix.length > 0 && url.startsWith(baseHrefWithoutLocaleSuffix)) {
        return url.substring(baseHrefWithoutLocaleSuffix.length);
      }
    }
    // Other route error URL, just go to /app/
    return '/app/';
  }

}
