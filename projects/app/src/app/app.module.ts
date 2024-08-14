import { NgModule, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@tailormap-viewer/core';
import { environment } from '../environments/environment';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    CoreModule.forRoot({
      production: environment.production,
      viewerBaseUrl: environment.viewerBaseUrl,
    }),
    BrowserAnimationsModule,
    ...environment.imports,
  ],
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
        headerName: TailormapApiConstants.XSRF_HEADER_NAME,
      }),
    ),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
