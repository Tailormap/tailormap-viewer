import * as SearchIndexActions from './search-index.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { initialSearchIndexState, SearchIndexState } from './search-index.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const setDraftSearchIndexId = (
  state: SearchIndexState,
  draftIndexId: number | null,
): SearchIndexState => {
  const searchIndex = state.searchIndexes.find(s => s.id === draftIndexId);
  return {
    ...state,
    draftSearchIndexId: draftIndexId,
    draftSearchIndex: searchIndex ? { ...searchIndex } : undefined,
    draftSearchUpdated: false,
    draftSearchValid: true,
  };
};

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
): SearchIndexState => setDraftSearchIndexId(state, payload.id);

const onAddSearchIndex = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.addSearchIndex>,
): SearchIndexState => {
  if(state.searchIndexes.some(a => a.id === payload.searchIndex.id)) {
    return state;
  }
  const updatedState = {
    ...state,
    searchIndexes: [ ...state.searchIndexes, payload.searchIndex ],
  };
  if (payload.searchIndex.id === state.draftSearchIndexId) {
    return setDraftSearchIndexId(updatedState, payload.searchIndex.id);
  }
  return updatedState;
};

const onUpdateSearchIndex = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.updateSearchIndex>,
): SearchIndexState => {
  const idx = state.searchIndexes.findIndex(searchIndex => searchIndex.id === payload.searchIndex.id);
  if (idx === -1) {
    return state;
  }
  const updatedState = {
    ...state,
    searchIndexes: [
      ...state.searchIndexes.slice(0, idx),
      { ...state.searchIndexes[idx], ...payload.searchIndex },
      ...state.searchIndexes.slice(idx + 1),
    ],
  };
  if (payload.searchIndex.id === state.draftSearchIndexId) {
    return setDraftSearchIndexId(updatedState, payload.searchIndex.id);
  }
  return updatedState;
};

const onDeleteSearchIndex = (
  state: SearchIndexState,
  payload: ReturnType<typeof SearchIndexActions.deleteSearchIndex>,
): SearchIndexState => {
  const updatedState = {
    ...state,
    searchIndexes: state.searchIndexes.filter(searchIndex => searchIndex.id !== payload.searchIndexId),
  };
  if (state.draftSearchIndexId === payload.searchIndexId) {
    return setDraftSearchIndexId(updatedState, null);
  }
  return updatedState;
};

const searchIndexReducerImpl = createReducer<SearchIndexState>(
  initialSearchIndexState,
  on(SearchIndexActions.loadSearchIndexesStart, onLoadSearchIndexesStart),
  on(SearchIndexActions.loadSearchIndexesSuccess, onLoadSearchIndexesSuccess),
  on(SearchIndexActions.loadSearchIndexesFailed, onLoadSearchIndexesFailed),
  on(SearchIndexActions.setSearchIndexListFilter, onSetSearchIndexListFilter),
  on(SearchIndexActions.clearSelectedSearchIndex, onClearSelectedSearchIndex),
  on(SearchIndexActions.setDraftSearchIndexId, onSetDraftSearchIndexId),
  on(SearchIndexActions.addSearchIndex, onAddSearchIndex),
  on(SearchIndexActions.updateSearchIndex, onUpdateSearchIndex),
  on(SearchIndexActions.deleteSearchIndex, onDeleteSearchIndex),
);
export const searchIndexReducer = (state: SearchIndexState | undefined, action: Action) => searchIndexReducerImpl(state, action);
