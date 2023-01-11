import { createAction, props } from '@ngrx/store';

const tocActionsPrefix = '[Toc]';

export const setFilterEnabled = createAction(
  `${tocActionsPrefix} Set filter enabled`,
  props<{ filterEnabled: boolean }>(),
);

export const toggleFilterEnabled = createAction(
  `${tocActionsPrefix} Toggle filter enabled`,
);

export const setFilterTerm = createAction(
  `${tocActionsPrefix} Set filter term`,
  props<{ filterTerm: string | undefined }>(),
);

export const setInfoTreeNodeId = createAction(
  `${tocActionsPrefix} Set info tree node ID`,
  props<{ infoTreeNodeId: string | undefined }>(),
);
