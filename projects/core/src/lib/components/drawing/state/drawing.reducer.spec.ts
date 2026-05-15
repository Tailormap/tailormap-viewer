import * as DrawingActions from './drawing.actions';
import { DrawingState, initialDrawingState } from './drawing.state';
import { drawingReducer } from './drawing.reducer';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';

const feature: DrawingFeatureModel = {
  __fid: '1',
  geometry: 'GEOM',
  attributes: { type: DrawingFeatureTypeEnum.POINT, style: DrawingHelper.getDefaultStyle() },
};

describe('DrawingReducer', () => {

  test('adds feature', () => {
    const initialState: DrawingState = { ...initialDrawingState };
    const action = DrawingActions.addFeature({ feature: { ...feature } });
    expect(initialState.features).toEqual([]);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.features).toEqual([feature]);
  });

  test('adds and selects feature', () => {
    const initialState: DrawingState = { ...initialDrawingState };
    const action = DrawingActions.addFeature({ feature: { ...feature }, selectFeature: true });
    expect(initialState.features).toEqual([]);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.features).toEqual([feature]);
    expect(updatedState.selectedFeature).toEqual(feature.__fid);
  });

  test('removes feature feature', () => {
    const initialState: DrawingState = { ...initialDrawingState, features: [{ ...feature }] };
    const action = DrawingActions.removeAllDrawingFeatures();
    expect(initialState.features).toEqual([feature]);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.features).toEqual([]);
  });

  test('sets selected feature', () => {
    const initialState: DrawingState = { ...initialDrawingState };
    const action = DrawingActions.setSelectedFeature({ fid: '1' });
    expect(initialState.selectedFeature).toEqual(null);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.selectedFeature).toEqual('1');
  });

});
