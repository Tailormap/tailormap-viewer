import { enableProdMode, ErrorHandler } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import version from 'generated/version.json';

const SENTRY_DSN: string = (window as any).SENTRY_DSN;

const setupSentryProviders = async () => {
  if (SENTRY_DSN === '@SENTRY_DSN@') {
    return [];
  }
  const sentry = await import('@sentry/angular');
  const tracing = await import('@sentry/tracing');
  sentry.init({
    dsn: SENTRY_DSN,
    release: version.gitInfo.hash,
    environment: environment.production ? 'production' : 'development',
    integrations: [
      new tracing.BrowserTracing({
        tracingOrigins: [/^\/api/],
        routingInstrumentation: sentry.routingInstrumentation,
      }),
    ],
    // Capture 1% of traces in production
    tracesSampleRate: environment.production ? 0.01 : 1.0,
  });
  return [
    { provide: ErrorHandler, useValue: sentry.createErrorHandler({ showDialog: false }) },
  ];
};

const main = async () => {
  try {
    const sentryProviders = await setupSentryProviders();
    await platformBrowserDynamic(sentryProviders).bootstrapModule(AppModule);
  } catch (error) {
    console.error(error);
  }
};

if (environment.production) {
  enableProdMode();
}

main();
