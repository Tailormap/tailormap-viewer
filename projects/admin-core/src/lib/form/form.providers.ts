import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { formStateKey } from './state/form.state';
import { formReducer } from './state/form.reducer';
import { FormService } from './services/form.service';

export function provideForm(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(formStateKey, formReducer),
    provideEnvironmentInitializer(() => inject(FormService).listenForApplicationChanges()),
  ];
}
