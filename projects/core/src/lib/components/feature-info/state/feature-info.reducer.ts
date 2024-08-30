import * as FeatureInfoActions from './feature-info.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FeatureInfoState, initialFeatureInfoState } from './feature-info.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadFeatureInfo = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.loadFeatureInfo>,
): FeatureInfoState => ({
  ...state,
  mapCoordinates: payload.mapCoordinates,
  mouseCoordinates: payload.mouseCoordinates,
  dialogVisible: true,
  features: [],
  columnMetadata: [],
  layers: payload.layers,
});

const onFeatureInfoLoaded = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.featureInfoLoaded>,
): FeatureInfoState => ({
  ...state,
  features: [
    ...state.features,
    ...payload.featureInfo.features,
  ],
  columnMetadata: [
    ...state.columnMetadata,
    ...payload.featureInfo.columnMetadata,
  ],
  layers: state.layers.map(l => {
    if (l.id === payload.featureInfo.layerId) {
      return {
        ...l,
        loading: payload.featureInfo.error ? LoadingStateEnum.FAILED : LoadingStateEnum.LOADED,
        totalCount: payload.featureInfo.features.length,
        error: payload.featureInfo.error,
        selectedFeatureId: payload.featureInfo.features.length > 0
          ? payload.featureInfo.features[0].__fid
          : undefined,
      };
    }
    return l;
  }),
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

const onSetSelectedFeatureInfoLayer = (
  state: FeatureInfoState,
  payload: ReturnType<typeof FeatureInfoActions.setSelectedFeatureInfoLayer>,
): FeatureInfoState => ({
  ...state,
  selectedLayerId: payload.layer,
});

const selectNextFeature = (state: FeatureInfoState, direction: 'next' | 'previous'): FeatureInfoState => {
  if (!state.selectedLayerId) {
    return state;
  }
  const selectedLayerIdx = state.layers.findIndex(l => l.id === state.selectedLayerId);
  if (selectedLayerIdx === -1) {
    return state;
  }
  const selectedLayer = state.layers[selectedLayerIdx];
  const features = state.features.filter(f => f.layerId === state.selectedLayerId);
  const idx = features.findIndex(f => f.__fid === selectedLayer?.selectedFeatureId);
  let nextIdx = 0;
  if (direction === 'next') {
    nextIdx = idx === -1 || features.length === idx + 1 ? 0 : idx + 1;
  }
  if (direction === 'previous') {
    nextIdx = idx > 0 ? idx - 1 : features.length - 1;
  }
  return {
    ...state,
    layers: [
      ...state.layers.slice(0, selectedLayerIdx),
      { ...selectedLayer, selectedFeatureId: features[nextIdx].__fid },
      ...state.layers.slice(selectedLayerIdx + 1),
    ],
  };
};

const onShowNextFeatureInfoFeature = (state: FeatureInfoState): FeatureInfoState => selectNextFeature(state, 'next');

const onShowPreviousFeatureInfoFeature = (state: FeatureInfoState): FeatureInfoState => selectNextFeature(state, 'previous');

const featureInfoReducerImpl = createReducer<FeatureInfoState>(
  initialFeatureInfoState,
  on(FeatureInfoActions.loadFeatureInfo, onLoadFeatureInfo),
  on(FeatureInfoActions.featureInfoLoaded, onFeatureInfoLoaded),
  on(FeatureInfoActions.hideFeatureInfoDialog, onHideFeatureInfoDialog),
  on(FeatureInfoActions.expandCollapseFeatureInfoDialog, onExpandCollapseFeatureInfoDialog),
  on(FeatureInfoActions.setSelectedFeatureInfoLayer, onSetSelectedFeatureInfoLayer),
  on(FeatureInfoActions.showNextFeatureInfoFeature, onShowNextFeatureInfoFeature),
  on(FeatureInfoActions.showPreviousFeatureInfoFeature, onShowPreviousFeatureInfoFeature),
);
export const featureInfoReducer = (state: FeatureInfoState | undefined, action: Action) => featureInfoReducerImpl(state, action);
