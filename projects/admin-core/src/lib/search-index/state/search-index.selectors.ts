import { SearchIndexState, searchIndexStateKey } from './search-index.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchIndexModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { selectFeatureTypes } from '../../catalog/state/catalog.selectors';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';

export type SearchIndexList = Array<SearchIndexModel & { selected: boolean; featureType?: ExtendedFeatureTypeModel }>;

const selectSearchIndexState = createFeatureSelector<SearchIndexState>(searchIndexStateKey);

export const selectSearchIndexesLoadStatus = createSelector(selectSearchIndexState, state => state.searchIndexesLoadStatus);
export const selectSearchIndexesLoadError = createSelector(selectSearchIndexState, state => state.searchIndexesLoadError);
export const selectSearchIndexes = createSelector(selectSearchIndexState, state => state.searchIndexes);
export const selectSearchIndexesListFilter = createSelector(selectSearchIndexState, state => state.searchIndexesListFilter);
export const selectDraftSearchIndexId = createSelector(selectSearchIndexState, state => state.draftSearchIndexId);
export const selectDraftSearchIndex = createSelector(selectSearchIndexState, state => state.draftSearchIndex);

export const selectSearchIndexesForFeatureType = (featureTypeId: string) => createSelector(
  selectSearchIndexes,
  searchIndexes => {
    return searchIndexes.filter(f => f.featureTypeId === +featureTypeId);
  },
);

export const selectFilteredSearchIndexesList = createSelector(
  selectSearchIndexes,
  selectDraftSearchIndexId,
  selectSearchIndexesListFilter,
  selectFeatureTypes,
  (searchIndexes, draftSearchIndexId, filter, featureTypes): SearchIndexList => {
    return FilterHelper.filterByTerm(searchIndexes, filter, searchIndex => searchIndex.name)
      .map(a => ({
        ...a,
        featureType: featureTypes.find(ft => ft.originalId === `${a.featureTypeId}`),
        selected: a.id === draftSearchIndexId,
      }))
      .sort((a, b) => {
        return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
      });
  },
);
