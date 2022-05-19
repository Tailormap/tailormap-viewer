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

const onSetSelectedFeature = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.setSelectedFeature>,
): DrawingState => ({
  ...state,
  selectedFeature: payload.fid,
});

const onUpdateDrawingFeatureStyle = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.updateDrawingFeatureStyle>,
): DrawingState => {
  const idx = state.features.findIndex(f => f.__fid === payload.fid);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    features: [
      ...state.features.slice(0, idx),
      {
        ...state.features[idx],
        attributes: {
          ...state.features[idx].attributes,
          style: {
            ...state.features[idx].attributes.style,
            ...payload.style,
          },
        },
      },
      ...state.features.slice(idx + 1),
    ],
  };
};

const onRemoveDrawingFeature = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.removeDrawingFeature>,
): DrawingState => {
  const idx = state.features.findIndex(f => f.__fid === payload.fid);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    features: [
      ...state.features.slice(0, idx),
      ...state.features.slice(idx + 1),
    ],
  };
};

const onRemoveAllDrawingFeatures = (
  state: DrawingState,
): DrawingState => ({
  ...state,
  features: [],
});

const onSetSelectedDrawingStyle = (
  state: DrawingState,
  payload: ReturnType<typeof DrawingActions.setSelectedDrawingStyle>,
): DrawingState => ({
  ...state,
  selectedDrawingStyle: payload.drawingType,
});

const drawingReducerImpl = createReducer<DrawingState>(
  initialDrawingState,
  on(DrawingActions.addFeature, onAddFeature),
  on(DrawingActions.setSelectedFeature, onSetSelectedFeature),
  on(DrawingActions.updateDrawingFeatureStyle, onUpdateDrawingFeatureStyle),
  on(DrawingActions.removeDrawingFeature, onRemoveDrawingFeature),
  on(DrawingActions.removeAllDrawingFeatures, onRemoveAllDrawingFeatures),
  on(DrawingActions.setSelectedDrawingStyle, onSetSelectedDrawingStyle),
);
export const drawingReducer = (state: DrawingState | undefined, action: Action) => drawingReducerImpl(state, action);
