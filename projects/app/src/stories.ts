import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { StoriesDemoComponent } from '../../core/src/lib/pages/stories-demo/stories-demo.component';
import { storiesAppConfig } from './app/stories.config';
import { environment } from './environments/environment';

const main = async () => {
  try {
    await bootstrapApplication(StoriesDemoComponent, storiesAppConfig);
  } catch (error) {
    console.error(error);
  }
};

if (environment.production) {
  enableProdMode();
}

main();
