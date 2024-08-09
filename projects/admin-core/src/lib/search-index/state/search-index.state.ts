import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { SearchIndexModel } from '@tailormap-admin/admin-api';

export const searchIndexStateKey = 'admin-search-index';

export interface SearchIndexState {
  searchIndexesLoadStatus: LoadingStateEnum;
  searchIndexesLoadError?: string;
  searchIndexes: SearchIndexModel[];
  searchIndexesListFilter?: string | null;
  draftSearchIndexId?: number | null;
  draftSearchIndex?: SearchIndexModel;
  draftSearchUpdated?: boolean;
  draftSearchValid?: boolean;
}

export const initialSearchIndexState: SearchIndexState = {
  searchIndexesLoadStatus: LoadingStateEnum.INITIAL,
  searchIndexes: [],
};
