import * as DrawingActions from './drawing.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { DrawingState, initialDrawingState } from './drawing.state';

const onAddFeature = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.addFeature>,
): DrawingState => ({
  ...state,
  features: [ ...state.features, payload.feature ],
  selectedFeature: payload.selectFeature ? payload.feature.__fid : state.selectedFeature,
});

const onRemoveAllFeatures = (
  state: DrawingState,
): DrawingState => ({
  ...state,
  features: [],
});

const onSetSelectedFeature = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.setSelectedFeature>,
): DrawingState => ({
  ...state,
  selectedFeature: payload.fid,
});

const drawingReducerImpl = createReducer<DrawingState>(
  initialDrawingState,
  on(DrawingActions.addFeature, onAddFeature),
  on(DrawingActions.removeAllFeatures, onRemoveAllFeatures),
  on(DrawingActions.setSelectedFeature, onSetSelectedFeature),
);
export const drawingReducer = (state: DrawingState | undefined, action: Action) => drawingReducerImpl(state, action);
