import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { attributeListStateKey } from './state/attribute-list.state';
import { attributeListReducer } from './state/attribute-list.reducer';
import { AttributeListApiService } from './services/attribute-list-api.service';

export function provideAttributeList(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(attributeListStateKey, attributeListReducer),
    // Watches changes to visible layers to create tabs; must run after `provideState` above since it
    // needs `attributeListStateKey` to already be registered.
    provideEnvironmentInitializer(() => inject(AttributeListApiService).initDefaultAttributeListSource()),
  ];
}
