import { createAction, props } from '@ngrx/store';

const tocActionsPrefix = '[Toc]';

export const setFilterEnabled = createAction(
  `${tocActionsPrefix} Set filter enabled`,
  props<{ filterEnabled: boolean }>(),
);
export const setFilterTerm = createAction(
  `${tocActionsPrefix} Set filter term`,
  props<{ filterTerm: string | null }>(),
);

export const setInfoTreeNodeId = createAction(
  `${tocActionsPrefix} Set info tree node ID`,
  props<{ infoTreeNodeId: string | null }>(),
);
