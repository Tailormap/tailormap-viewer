import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { userStateKey } from './state/user.state';
import { userReducer } from './state/user.reducer';
import { UserService } from './services/user.service';
import { GroupService } from './services/group.service';

export function provideUser(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(userStateKey, userReducer),
    provideEnvironmentInitializer(() => {
      inject(UserService).listenForUserChanges();
      inject(GroupService).listenForGroupChanges();
    }),
  ];
}
