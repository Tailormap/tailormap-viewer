import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { ApplicationMapService } from './services/application-map.service';

export function provideApplicationMap(): Array<Provider | EnvironmentProviders> {
  return [
    provideEnvironmentInitializer(() => {
      inject(ApplicationMapService).init();
    }),
  ];
}
