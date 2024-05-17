import * as SearchIndexActions from './search-index.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { initialSearchIndexState, SearchIndexState } from './search-index.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadSearchIndexesStart = (state: SearchIndexState): SearchIndexState => ({
  ...state,
  searchIndexesLoadStatus: LoadingStateEnum.LOADING,
  searchIndexesLoadError: undefined,
  searchIndexes: [],
});

const onLoadSearchIndexesSuccess = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.loadSearchIndexesSuccess>,
): SearchIndexState => {
  const searchIndexes = payload.searchIndexes;
  const draftSearchIndex = typeof state.draftSearchIndexId === 'number'
    ? searchIndexes.find(s => s.id === state.draftSearchIndexId)
    : undefined;
  return {
    ...state,
    searchIndexesLoadStatus: LoadingStateEnum.LOADED,
    searchIndexesLoadError: undefined,
    searchIndexes,
    draftSearchIndex: draftSearchIndex ? { ...draftSearchIndex } : undefined,
  };
};

const onLoadSearchIndexesFailed = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.loadSearchIndexesFailed>,
): SearchIndexState => ({
  ...state,
  searchIndexesLoadStatus: LoadingStateEnum.FAILED,
  searchIndexesLoadError: payload.error,
  searchIndexes: [],
});

const onSetSearchIndexListFilter = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.setSearchIndexListFilter>,
): SearchIndexState => ({
  ...state,
  searchIndexesListFilter: payload.filter,
});

const onClearSelectedSearchIndex = (
  state: SearchIndexState,
): SearchIndexState => ({
  ...state,
  draftSearchIndexId: null,
});

const onSetDraftSearchIndexId = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.setDraftSearchIndexId>,
): SearchIndexState => {
  const searchIndex = state.searchIndexes.find(s => s.id === payload.id);
  return {
    ...state,
    draftSearchIndexId: payload.id,
    draftSearchIndex: searchIndex ? { ...searchIndex } : undefined,
    draftSearchUpdated: false,
    draftSearchValid: true,
  };
};

const searchIndexReducerImpl = createReducer<SearchIndexState>(
  initialSearchIndexState,
  on(SearchIndexActions.loadSearchIndexesStart, onLoadSearchIndexesStart),
  on(SearchIndexActions.loadSearchIndexesSuccess, onLoadSearchIndexesSuccess),
  on(SearchIndexActions.loadSearchIndexesFailed, onLoadSearchIndexesFailed),
  on(SearchIndexActions.setSearchIndexListFilter, onSetSearchIndexListFilter),
  on(SearchIndexActions.clearSelectedSearchIndex, onClearSelectedSearchIndex),
  on(SearchIndexActions.setDraftSearchIndexId, onSetDraftSearchIndexId),
);
export const searchIndexReducer = (state: SearchIndexState | undefined, action: Action) => searchIndexReducerImpl(state, action);
