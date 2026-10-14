import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { applicationStateKey } from './state/application.state';
import { applicationReducer } from './state/application.reducer';
import { ApplicationService } from './services/application.service';
import { provideConfigurationComponents } from './components/components.providers';

export function provideApplication(): Array<Provider | EnvironmentProviders> {
  return [
    ...provideConfigurationComponents(),
    provideState(applicationStateKey, applicationReducer),
    provideEnvironmentInitializer(() => {
      inject(ApplicationService).listenForApplicationChanges();
    }),
  ];
}
