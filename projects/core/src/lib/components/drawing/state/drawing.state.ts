import { DrawingFeatureModel } from '../models/drawing-feature.model';

export const drawingStateKey = 'drawing';

export interface DrawingState {
  features: DrawingFeatureModel[];
}

export const initialDrawingState: DrawingState = {
  features: [],
};
