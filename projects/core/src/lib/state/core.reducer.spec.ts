import { initialCoreState } from './core.state';
import { loadApplication, loadApplicationFailed, loadApplicationSuccess } from './core.actions';
import { getAppLayerModel, getAppResponseData, getMapResponseData, LoadingStateEnum } from '@tailormap-viewer/api';
import { coreReducer } from './core.reducer';

describe('CoreReducer', () => {

  test('load application action', () => {
    const initialState = { ...initialCoreState };
    const action = loadApplication();
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADING);
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
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADED);
  });

  test('load application failed action', () => {
    const initialState = { ...initialCoreState };
    const action = loadApplicationFailed({
      error: 'Something went really wrong',
    });
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.FAILED);
    expect(updatedState.error).toEqual('Something went really wrong');
  });

});
