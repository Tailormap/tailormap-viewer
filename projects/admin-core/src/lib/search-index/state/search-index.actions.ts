import { createAction, props } from '@ngrx/store';
import { SearchIndexModel } from '@tailormap-admin/admin-api';

const searchIndexActionsPrefix = '[Admin/SearchIndex]';

export const loadSearchIndexes = createAction(
  `${searchIndexActionsPrefix} Load SearchIndexes`,
);

export const loadSearchIndexesStart = createAction(
  `${searchIndexActionsPrefix} Load SearchIndexes Start`,
);

export const loadSearchIndexesSuccess = createAction(
  `${searchIndexActionsPrefix}  Load SearchIndexes Success`,
  props<{ searchIndexes: SearchIndexModel[] }>(),
);

export const loadSearchIndexesFailed = createAction(
  `${searchIndexActionsPrefix}  Load SearchIndexes Failed`,
  props<{ error?: string }>(),
);

export const setSearchIndexListFilter = createAction(
  `${searchIndexActionsPrefix} Set SearchIndex List Filter`,
  props<{ filter: string | null | undefined }>(),
);

export const clearSelectedSearchIndex = createAction(
  `${searchIndexActionsPrefix} Clear Selected SearchIndex`,
);

export const setDraftSearchIndexId = createAction(
  `${searchIndexActionsPrefix} Set Draft Search Index ID`,
  props<{ id: number }>(),
);

export const addSearchIndex = createAction(
  `${searchIndexActionsPrefix} Add Search Index`,
  props<{ searchIndex: SearchIndexModel }>(),
);

export const updateSearchIndex = createAction(
  `${searchIndexActionsPrefix} Update Search Index`,
  props<{ searchIndex: SearchIndexModel }>(),
);

export const deleteSearchIndex = createAction(
  `${searchIndexActionsPrefix} Delete Search Index`,
  props<{ searchIndexId: number }>(),
);


