import { EnvironmentProviders, Provider } from '@angular/core';
import { provideState } from '@ngrx/store';
import { filterComponentReducer } from './state/filter-component.reducer';
import { filterComponentStateKey } from './state/filter-component.state';

export function provideFilterComponent(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(filterComponentStateKey, filterComponentReducer),
  ];
}
