import { EnvironmentProviders, Provider } from '@angular/core';
import { provideState } from '@ngrx/store';
import { tasksStateKey } from './state/tasks.state';
import { tasksReducer } from './state/tasks.reducer';

export function provideTasks(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(tasksStateKey, tasksReducer),
  ];
}
