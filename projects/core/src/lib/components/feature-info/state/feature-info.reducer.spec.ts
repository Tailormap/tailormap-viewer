import * as FeatureInfoActions from './feature-info.actions';
import { featureInfoReducer } from './feature-info.reducer';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { FeatureInfoModel } from '../models/feature-info.model';
import { getAppLayerModel, getColumnMetadataModel, getFeatureModel } from '@tailormap-viewer/api';

describe('FeatureInfoReducer', () => {

  test('handles LoadFeatureInfo', () => {
    const state = {...initialFeatureInfoState};
    const action = FeatureInfoActions.loadFeatureInfo({ mouseCoordinates: [1,2], mapCoordinates: [2,3] });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.mapCoordinates).toEqual([2,3]);
    expect(updatedState.mouseCoordinates).toEqual([1,2]);
    expect(updatedState.loadingData).toEqual(true);
  });

  test('handles LoadFeatureInfoSuccess', () => {
    const state = {...initialFeatureInfoState};
    const featureInfo: FeatureInfoModel[] = [{
      features: [ getFeatureModel() ],
      columnMetadata: [ getColumnMetadataModel() ],
      layer: getAppLayerModel(),
    }];
    const action = FeatureInfoActions.loadFeatureInfoSuccess({ featureInfo });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.featureInfo).toEqual(featureInfo);
    expect(updatedState.loadingData).toEqual(false);
    expect(updatedState.loadingDataFailed).toEqual(false);
  });

  test('handles LoadFeatureInfoFailed', () => {
    const state = {...initialFeatureInfoState};
    const action = FeatureInfoActions.loadFeatureInfoFailed({ errorMessage: 'Loading data failed for some reason' });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.featureInfo).toEqual([]);
    expect(updatedState.loadingData).toEqual(false);
    expect(updatedState.loadingDataFailed).toEqual(true);
    expect(updatedState.errorMessage).toEqual('Loading data failed for some reason');
  });

  test('handles ShowFeatureInfoDialog', () => {
    const state = {...initialFeatureInfoState};
    const action = FeatureInfoActions.showFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogVisible).toEqual(true);
  });

  test('handles HideFeatureInfoDialog', () => {
    const state = {...initialFeatureInfoState};
    const action = FeatureInfoActions.hideFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogVisible).toEqual(false);
  });

  test('handles expandCollapseFeatureInfoDialog', () => {
    const state: FeatureInfoState = {...initialFeatureInfoState, dialogCollapsed: false };
    const action = FeatureInfoActions.expandCollapseFeatureInfoDialog();
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.dialogCollapsed).toEqual(true);
    const updatedState2 = featureInfoReducer(updatedState, action);
    expect(updatedState2.dialogCollapsed).toEqual(false);
  });

});
