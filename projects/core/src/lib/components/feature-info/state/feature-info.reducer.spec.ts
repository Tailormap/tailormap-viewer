import * as FeatureInfoActions from './feature-info.actions';
import { featureInfoReducer } from './feature-info.reducer';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { getColumnMetadataModel, getFeatureModel } from '@tailormap-viewer/api';

describe('FeatureInfoReducer', () => {

  test('handles LoadFeatureInfo', () => {
    const state = { ...initialFeatureInfoState };
    const action = FeatureInfoActions.loadFeatureInfo({ mouseCoordinates: [ 1, 2 ], mapCoordinates: [ 2, 3 ], layers: [] });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.mapCoordinates).toEqual([ 2, 3 ]);
    expect(updatedState.mouseCoordinates).toEqual([ 1, 2 ]);
    expect(updatedState.layers).toEqual([]);
  });

  test('handles LoadFeatureInfoSuccess', () => {
    const state = { ...initialFeatureInfoState };
    const featureInfo: FeatureInfoResponseModel = {
      features: [{ ...getFeatureModel(), layerId: '1' }],
      columnMetadata: [{ ...getColumnMetadataModel(), layerId: '1' }],
      layerId: '1',
    };
    const action = FeatureInfoActions.featureInfoLoaded({ featureInfo });
    const updatedState = featureInfoReducer(state, action);
    expect(updatedState.features).toEqual(featureInfo.features);
    expect(updatedState.columnMetadata).toEqual(featureInfo.columnMetadata);
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
