import { initialCoreState } from './core.state';
import { loadViewer, loadViewerFailed, loadViewerSuccess } from './core.actions';
import { getViewerResponseData } from '@tailormap-viewer/api';
import { coreReducer } from './core.reducer';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

describe('CoreReducer', () => {

  test('load application action', () => {
    const initialState = { ...initialCoreState };
    const action = loadViewer({});
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADING);
  });

  test('load application success action', () => {
    const initialState = { ...initialCoreState };
    const action = loadViewerSuccess({
      application: getViewerResponseData(),
      components: [],
    });
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADED);
  });

  test('load application failed action', () => {
    const initialState = { ...initialCoreState };
    const action = loadViewerFailed({
      error: 'Something went really wrong',
    });
    expect(initialState.loadStatus).toEqual(LoadingStateEnum.INITIAL);
    const updatedState = coreReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.FAILED);
    expect(updatedState.error).toEqual('Something went really wrong');
  });

});
