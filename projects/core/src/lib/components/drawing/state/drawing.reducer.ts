import * as DrawingActions from './drawing.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { DrawingState, initialDrawingState } from './drawing.state';

const onAddFeature = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.addFeature>,
): DrawingState => ({
  ...state,
  features: [ ...state.features, payload.feature ],
});

const onRemoveAllFeatures = (
  state: DrawingState,
): DrawingState => ({
  ...state,
  features: [],
});

const drawingReducerImpl = createReducer<DrawingState>(
  initialDrawingState,
  on(DrawingActions.addFeature, onAddFeature),
  on(DrawingActions.removeAllFeatures, onRemoveAllFeatures),
);
export const drawingReducer = (state: DrawingState | undefined, action: Action) => drawingReducerImpl(state, action);
