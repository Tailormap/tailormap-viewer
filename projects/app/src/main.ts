import { enableProdMode, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { CoreModule } from '@tailormap-viewer/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';

const main = async () => {
  try {
    await bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, CoreModule.forRoot({
            production: environment.production,
            viewerBaseUrl: environment.viewerBaseUrl,
        }), BrowserAnimationsModule, ...environment.imports),
        provideHttpClient(withInterceptorsFromDi(), withXsrfConfiguration({
            cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
            headerName: TailormapApiConstants.XSRF_HEADER_NAME,
        }))
    ]
});
  } catch (error) {
    console.error(error);
  }
};

if (environment.production) {
  enableProdMode();
}

main();
