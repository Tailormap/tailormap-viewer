import { DrawingFeatureModel } from '../models/drawing-feature.model';

export const drawingStateKey = 'drawing';

export interface DrawingState {
  features: DrawingFeatureModel[];
  selectedFeature: string | null;
}

export const initialDrawingState: DrawingState = {
  features: [],
  selectedFeature: null,
};
