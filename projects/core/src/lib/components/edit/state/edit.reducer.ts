import * as EditActions from './edit.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { EditState, initialEditState } from './edit.state';

const onSetIsActive = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setEditActive>,
): EditState => ({
  ...state,
  isActive: payload.active,
});

const onSetSelectedLayer = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setSelectedEditLayer>,
): EditState => ({
  ...state,
  selectedLayer: payload.layer,
});

const editReducerImpl = createReducer<EditState>(
  initialEditState,
  on(EditActions.setEditActive, onSetIsActive),
  on(EditActions.setSelectedEditLayer, onSetSelectedLayer),
);
export const editReducer = (state: EditState | undefined, action: Action) => editReducerImpl(state, action);
