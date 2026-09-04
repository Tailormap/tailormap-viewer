import { EnvironmentProviders, Provider } from '@angular/core';
import { provideState } from '@ngrx/store';
import { editStateKey } from './state/edit.state';
import { editReducer } from './state/edit.reducer';

export function provideEdit(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(editStateKey, editReducer),
  ];
}
