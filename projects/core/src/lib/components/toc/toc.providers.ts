import { EnvironmentProviders, Provider } from '@angular/core';
import { provideState } from '@ngrx/store';
import { tocReducer } from './state/toc.reducer';
import { tocStateKey } from './state/toc.state';

export function provideToc(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(tocStateKey, tocReducer),
  ];
}
