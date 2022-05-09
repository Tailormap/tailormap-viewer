import * as DrawingActions from './drawing.actions';
import { DrawingState, initialDrawingState } from './drawing.state';
import { drawingReducer } from './drawing.reducer';

describe('DrawingReducer', () => {

  test('adds feature', () => {
    const initialState: DrawingState = { ...initialDrawingState };
    const action = DrawingActions.addFeature({ feature: { geometry: 'GEOM', type: 'POINT' } });
    expect(initialState.features).toEqual([]);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.features).toEqual([{ geometry: 'GEOM', type: 'POINT' }]);
  });

  test('removes feature feature', () => {
    const initialState: DrawingState = { ...initialDrawingState, features: [{ geometry: 'GEOM', type: 'POINT' }] };
    const action = DrawingActions.removeAllFeatures();
    expect(initialState.features).toEqual([{ geometry: 'GEOM', type: 'POINT' }]);
    const updatedState = drawingReducer(initialState, action);
    expect(updatedState.features).toEqual([]);
  });

});
