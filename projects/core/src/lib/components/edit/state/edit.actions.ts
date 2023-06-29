import { createAction, props } from '@ngrx/store';

const editActionsPrefix = '[Edit]';

export const setEditActive = createAction(
  `${editActionsPrefix} Set Active`,
  props<{ active: boolean }>(),
);

export const setSelectedEditLayer = createAction(
  `${editActionsPrefix} Set Selected Layer`,
  props<{ layer: string | null }>(),
);
