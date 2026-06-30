import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const main = async () => {
  try {
    await platformBrowserDynamic().bootstrapModule(AppModule);
  } catch (error) {
    console.error(error);
  }
};

if (environment.production) {
  enableProdMode();
}

main();
