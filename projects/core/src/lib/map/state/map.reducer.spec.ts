import * as MapActions from './map.actions';
import { MapState, initialMapState } from './map.state';
import { mapReducer } from './map.reducer';

describe('MapReducer', () => {

  test('sets some prop', () => {
    const initialState: MapState = { ...initialMapState };
    const action = MapActions.setSomeProp({ someProp: true });
    expect(initialState.someProp).toEqual(false);
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.someProp).toEqual(true);
  });

});
