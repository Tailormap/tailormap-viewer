import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { searchIndexStateKey } from './state/search-index.state';
import { searchIndexReducer } from './state/search-index.reducer';
import { SearchIndexService } from './services/search-index.service';

export function provideSearchIndex(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(searchIndexStateKey, searchIndexReducer),
    provideEnvironmentInitializer(() => inject(SearchIndexService).listenForSearchIndexChanges()),
  ];
}
