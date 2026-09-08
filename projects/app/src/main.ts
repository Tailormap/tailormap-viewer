import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { provideCore } from '@tailormap-viewer/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';

const main = async () => {
  try {
    await bootstrapApplication(AppComponent, {
      providers: [
        provideZoneChangeDetection(),
        provideCore({
          production: environment.production,
          viewerBaseUrl: environment.viewerBaseUrl,
        }),
        provideAnimations(),
        ...environment.providers,
        provideHttpClient(withInterceptorsFromDi(), withXsrfConfiguration({
          cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
          headerName: TailormapApiConstants.XSRF_HEADER_NAME,
        })),
      ],
    });
  } catch (error) {
    console.error(error);
  }
};

if (environment.production) {
  enableProdMode();
}

main();
