import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import version from 'generated/version.json';

const SENTRY_DSN: string = (window as any).SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN === '@SENTRY_DSN@' ? undefined : SENTRY_DSN,
  release: version.gitInfo.hash,
  environment: environment.production ? 'production' : 'development',
  integrations: [
    new BrowserTracing({
      tracingOrigins: [/^\/api/],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],

  // Capture 1% of traces in production
  tracesSampleRate: environment.production ? 0.01 : 1.0,
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
