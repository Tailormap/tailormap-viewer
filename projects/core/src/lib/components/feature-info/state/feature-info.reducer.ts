import * as FeatureInfoActions from './feature-info.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { expandCollapseFeatureInfoDialog } from './feature-info.actions';

const onLoadFeatureInfo = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfo>,
): FeatureInfoState => ({
  ...state,
  mapCoordinates: payload.mapCoordinates,
  mouseCoordinates: payload.mouseCoordinates,
  loadingData: true,
});

const onLoadFeatureInfoSuccess = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfoSuccess>,
): FeatureInfoState => ({
  ...state,
  featureInfo: payload.featureInfo,
  loadingData: false,
  loadingDataFailed: false,
});

const onLoadFeatureInfoFailed = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfoFailed>,
): FeatureInfoState => ({
  ...state,
  errorMessage: payload.errorMessage,
  loadingData: false,
  loadingDataFailed: true,
});

const onShowFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({ ...state, dialogVisible: true });
const onHideFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({ ...state, dialogVisible: false });

const onExpandCollapseFeatureInfoDialog = (state: FeatureInfoState): FeatureInfoState => ({
  ...state,
  dialogCollapsed: !state.dialogCollapsed,
});

const featureInfoReducerImpl = createReducer<FeatureInfoState>(
  initialFeatureInfoState,
  on(FeatureInfoActions.loadFeatureInfo, onLoadFeatureInfo),
  on(FeatureInfoActions.loadFeatureInfoSuccess, onLoadFeatureInfoSuccess),
  on(FeatureInfoActions.loadFeatureInfoFailed, onLoadFeatureInfoFailed),
  on(FeatureInfoActions.showFeatureInfoDialog, onShowFeatureInfoDialog),
  on(FeatureInfoActions.hideFeatureInfoDialog, onHideFeatureInfoDialog),
  on(FeatureInfoActions.expandCollapseFeatureInfoDialog, onExpandCollapseFeatureInfoDialog),
);
export const featureInfoReducer = (state: FeatureInfoState | undefined, action: Action) => featureInfoReducerImpl(state, action);
