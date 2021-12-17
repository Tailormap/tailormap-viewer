import { initialCoreState } from './core.state';
import { loadApplication, loadApplicationSuccess } from './core.actions';
import { getAppLayerModel, getAppResponseData, getMapResponseData, LoadingStateEnum } from '@tailormap-viewer/api';
import { coreReducer } from './core.reducer';

describe('CoreReducer', () => {

  test('load application action', () => {
    const initialState = { ...initialCoreState };
    const action = loadApplication();
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.LOADING);
  });

  test('load application success action', () => {
    const initialState = { ...initialCoreState };
    const action = loadApplicationSuccess({
      map: getMapResponseData(),
      application: getAppResponseData(),
      layers: [ getAppLayerModel({ id: 10 }), getAppLayerModel({ id: 11 }) ],
      components: [],
    });
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.LOADED);
  });

});
