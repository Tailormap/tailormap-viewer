import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { NavigationError, Router } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationErrorRouterService {
  constructor(router: Router, @Inject(APP_BASE_HREF) baseHref: string, @Inject(LOCALE_ID) localeId: string) {
    // Use an alternative catch-all route instead of '**', this allows libraries to add routes
    router.events.pipe(
      takeUntilDestroyed(),
      filter((event): event is NavigationError => event instanceof NavigationError),
    ).subscribe((event: NavigationError) => {
      router.navigateByUrl(NavigationErrorRouterService.getErrorNavigationUrl(event.url, baseHref, localeId)); // We could navigate to route showing 404
    });
  }

  public static getErrorNavigationUrl(url: string, baseHref: string, localeId: string): string {
    const localeSuffix = `/${localeId}/`;
    // If the error URL starts with the base href but without the locale suffix, navigate to the part after that
    // Example: /some-base/app/myapp, but the base href is /some-base/en/, navigate to /app/myapp
    if(baseHref.endsWith(localeSuffix)) {
      const baseHrefWithoutLocaleSuffix = baseHref.substring(0, baseHref.length - localeSuffix.length);
      if (url.startsWith(baseHrefWithoutLocaleSuffix)) {
        return url.substring(baseHrefWithoutLocaleSuffix.length);
      }
    }
    // Other route error URL, just go to /app/
    return '/app/';
  }

}
