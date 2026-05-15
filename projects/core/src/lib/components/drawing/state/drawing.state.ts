import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';

export const drawingStateKey = 'drawing';

export interface DrawingState {
  features: DrawingFeatureModel[];
  selectedFeature: string | null;
  selectedDrawingType: DrawingFeatureTypeEnum | null;
}

export const initialDrawingState: DrawingState = {
  features: [],
  selectedFeature: null,
  selectedDrawingType: null,
};
