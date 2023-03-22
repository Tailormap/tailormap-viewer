import * as FeatureInfoActions from './feature-info.actions';
import { featureInfoReducer } from './feature-info.reducer';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { getAppLayerModel, getColumnMetadataModel, getFeatureModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

describe('FeatureInfoReducer', () => {

  test('handles LoadFeatureInfo', () => {
    const state = { ...initialFeatureInfoState };
    const action = FeatureInfoActions.loadFeatureInfo({ mouseCoordinates: [ 1, 2 ], mapCoordinates: [ 2, 3 ] });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.mapCoordinates).toEqual([ 2, 3 ]);
    expect(updatedState.mouseCoordinates).toEqual([ 1, 2 ]);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADING);
  });

  test('handles LoadFeatureInfoSuccess', () => {
    const state = { ...initialFeatureInfoState };
    const featureInfo: FeatureInfoResponseModel[] = [{
      features: [{ ...getFeatureModel(), layerId: '1' }],
      columnMetadata: [{ ...getColumnMetadataModel(), layerId: '1' }],
      layerId: '1',
    }];
    const action = FeatureInfoActions.loadFeatureInfoSuccess({ featureInfo });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.features).toEqual(featureInfo[0].features);
    expect(updatedState.columnMetadata).toEqual(featureInfo[0].columnMetadata);
    expect(updatedState.currentFeatureIndex).toEqual(0);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADED);
  });

  test('handles LoadFeatureInfoFailed', () => {
    const state = { ...initialFeatureInfoState };
    const action = FeatureInfoActions.loadFeatureInfoFailed({ errorMessage: 'Loading data failed for some reason' });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.features).toEqual([]);
    expect(updatedState.columnMetadata).toEqual([]);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.FAILED);
    expect(updatedState.errorMessage).toEqual('Loading data failed for some reason');
  });

  test('handles ShowFeatureInfoDialog', () => {
    const state = { ...initialFeatureInfoState };
    const action = FeatureInfoActions.showFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogVisible).toEqual(true);
  });

  test('handles HideFeatureInfoDialog', () => {
    const state = { ...initialFeatureInfoState };
    const action = FeatureInfoActions.hideFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogVisible).toEqual(false);
  });

  test('handles expandCollapseFeatureInfoDialog', () => {
    const state: FeatureInfoState = { ...initialFeatureInfoState, dialogCollapsed: false };
    const action = FeatureInfoActions.expandCollapseFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogCollapsed).toEqual(true);
    const updatedState2 = featureInfoReducer(updatedState, action);
    expect(updatedState2.dialogCollapsed).toEqual(false);
  });

});
