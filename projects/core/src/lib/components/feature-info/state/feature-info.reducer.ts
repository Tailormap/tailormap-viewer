import * as FeatureInfoActions from './feature-info.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../models/feature-info-column-metadata.model';

const onLoadFeatureInfo = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfo>,
): FeatureInfoState => ({
  ...state,
  mapCoordinates: payload.mapCoordinates,
  mouseCoordinates: payload.mouseCoordinates,
  loadStatus: LoadingStateEnum.LOADING,
});

const onLoadFeatureInfoSuccess = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfoSuccess>,
): FeatureInfoState => ({
  ...state,
  features: payload.featureInfo.reduce<FeatureInfoFeatureModel[]>((allFeatures, featureInfoModel) => allFeatures.concat(featureInfoModel.features), []),
  columnMetadata: payload.featureInfo.reduce<FeatureInfoColumnMetadataModel[]>((allMetadata, featureInfoModel) => allMetadata.concat(featureInfoModel.columnMetadata), []),
  loadStatus: LoadingStateEnum.LOADED,
  currentFeatureIndex: 0,
});

const onLoadFeatureInfoFailed = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfoFailed>,
): FeatureInfoState => ({
  ...state,
  errorMessage: payload.errorMessage,
  loadStatus: LoadingStateEnum.FAILED,
  currentFeatureIndex: 0,
});

const onShowFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  dialogVisible: true,
});

const onHideFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  dialogVisible: false,
  dialogCollapsed: false,
});

const onExpandCollapseFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  dialogCollapsed: !state.dialogCollapsed,
});

const onShowNextFeatureInfoFeature = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  currentFeatureIndex: state.features.length === state.currentFeatureIndex + 1 ? 0 : state.currentFeatureIndex + 1,
});

const onShowPreviousFeatureInfoFeature = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  currentFeatureIndex: state.currentFeatureIndex > 0 ? state.currentFeatureIndex - 1 : state.features.length - 1,
});

const featureInfoReducerImpl = createReducer<FeatureInfoState>(
  initialFeatureInfoState,
  on(FeatureInfoActions.loadFeatureInfo, onLoadFeatureInfo),
  on(FeatureInfoActions.loadFeatureInfoSuccess, onLoadFeatureInfoSuccess),
  on(FeatureInfoActions.loadFeatureInfoFailed, onLoadFeatureInfoFailed),
  on(FeatureInfoActions.showFeatureInfoDialog, onShowFeatureInfoDialog),
  on(FeatureInfoActions.hideFeatureInfoDialog, onHideFeatureInfoDialog),
  on(FeatureInfoActions.expandCollapseFeatureInfoDialog, onExpandCollapseFeatureInfoDialog),
  on(FeatureInfoActions.showNextFeatureInfoFeature, onShowNextFeatureInfoFeature),
  on(FeatureInfoActions.showPreviousFeatureInfoFeature, onShowPreviousFeatureInfoFeature),
);
export const featureInfoReducer = (state: FeatureInfoState | undefined, action: Action) => featureInfoReducerImpl(state, action);
