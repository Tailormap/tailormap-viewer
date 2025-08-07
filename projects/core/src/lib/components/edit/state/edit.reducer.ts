import * as EditActions from './edit.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { EditState, initialEditState } from './edit.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../../feature-info/models/feature-info-column-metadata.model';

const onSetIsActive = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setEditActive>,
): EditState => ({
  ...state,
  isActive: payload.active,
  isCreateNewFeatureActive: payload.active ? state.isCreateNewFeatureActive : false,
  dialogVisible: false,
  selectedFeature: null,
});

const onSetSelectedLayer = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setSelectedEditLayer>,
): EditState => ({
  ...state,
  selectedLayer: payload.layer,
  dialogVisible: false,
  dialogCollapsed: false,
  selectedFeature: null,
  isCreateNewFeatureActive: false,
});

const onLoadFeatureInfo = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadEditFeatures>,
): EditState => ({
  ...state,
  mapCoordinates: payload.coordinates,
  loadStatus: LoadingStateEnum.LOADING,
  features: [],
  dialogVisible: false,
});

const onLoadEditFeaturesSuccess = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadEditFeaturesSuccess>,
): EditState => {
  const features = payload.featureInfo.reduce<FeatureInfoFeatureModel[]>((allFeatures, featureInfoModel) => allFeatures.concat(featureInfoModel.features), []);
  const selectedFeature = features.length === 1 ? features[0].__fid : null;
  return {
    ...state,
    features,
    columnMetadata: payload.featureInfo.reduce<FeatureInfoColumnMetadataModel[]>((allMetadata, featureInfoModel) => allMetadata.concat(featureInfoModel.columnMetadata), []),
    loadStatus: LoadingStateEnum.LOADED,
    selectedFeature,
    dialogVisible: features.length > 0,
    dialogCollapsed: false,
  };
};

const onSetCreateNewFeatureActive = (
    state: EditState,
    payload: ReturnType<typeof EditActions.setEditCreateNewFeatureActive>,
): EditState => {
  const onlyChangeGeometryType = state.isCreateNewFeatureActive && state.columnMetadata[0]?.layerId === payload.columnMetadata[0].layerId;
  if (onlyChangeGeometryType) {
    // Do not cause selectSelectedEditFeature selector to emit new event causing the form to reset
    return {
      ...state,
      newGeometryType: payload.geometryType,
    };
  } else {
    return {
      ...state,
      isCreateNewFeatureActive: payload.active,
      newGeometryType: payload.geometryType,
      dialogVisible: payload.active,
      selectedFeature: 'new',
      features: [{
        layerId: payload.columnMetadata[0].layerId,
        __fid: 'new',
        attributes: {},
      }],
      columnMetadata: payload.columnMetadata,
      loadStatus: LoadingStateEnum.LOADED,
      dialogCollapsed: false,
    };
  }
};

const onLoadEditFeaturesFailed = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadEditFeaturesFailed>,
): EditState => ({
  ...state,
  errorMessage: payload.errorMessage,
  features: [],
  selectedFeature: null,
  loadStatus: LoadingStateEnum.FAILED,
});

const onSetSelectedEditFeature = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setSelectedEditFeature>,
): EditState => ({
  ...state,
  selectedFeature: payload.fid,
  isCreateNewFeatureActive: false,
});

const onSetLoadedEditFeature = (
  state: EditState,
  payload: ReturnType<typeof EditActions.setLoadedEditFeature>,
): EditState => {
  return {
    ...state,
    features: [payload.feature],
    columnMetadata: payload.columnMetadata,
    loadStatus: LoadingStateEnum.LOADED,
    selectedFeature: payload.feature.__fid,
    dialogVisible: true,
    dialogCollapsed: false,
    selectedLayer: payload.feature.layerId,
  };
};

const onShowEditDialog = (state: EditState): EditState => ({
  ...state,
  dialogVisible: true,
});

const onHideEditDialog = (state: EditState): EditState => ({
  ...state,
  dialogVisible: false,
  dialogCollapsed: false,
  selectedFeature: null,
  isCreateNewFeatureActive: false,
});

const onExpandCollapseEditDialog = (state: EditState): EditState => ({
  ...state,
  dialogCollapsed: !state.dialogCollapsed,
});

const onUpdateEditFeature = (
  state: EditState,
  payload: ReturnType<typeof EditActions.updateEditFeature>,
): EditState => {
  const featureIdx = state.features.findIndex(f => f.__fid === payload.feature.__fid && f.layerId === payload.layerId);
  if (featureIdx === -1) {
    return state;
  }
  return {
    ...state,
    features: [
      ...state.features.slice(0, featureIdx),
      { ...payload.feature, layerId: payload.layerId },
      ...state.features.slice(featureIdx + 1),
    ],
    isCreateNewFeatureActive: false,
  };
};

const onEditNewlyCreatedFeature = (
  state: EditState,
  payload: ReturnType<typeof EditActions.editNewlyCreatedFeature>,
): EditState => {
  return {
    ...state,
    features: [payload.feature],
    selectedFeature: payload.feature.__fid,
    isCreateNewFeatureActive: false,
  };

};

const editReducerImpl = createReducer<EditState>(
  initialEditState,
  on(EditActions.setEditActive, onSetIsActive),
  on(EditActions.setEditCreateNewFeatureActive, onSetCreateNewFeatureActive),
  on(EditActions.setSelectedEditLayer, onSetSelectedLayer),
  on(EditActions.loadEditFeatures, onLoadFeatureInfo),
  on(EditActions.loadEditFeaturesSuccess, onLoadEditFeaturesSuccess),
  on(EditActions.loadEditFeaturesFailed, onLoadEditFeaturesFailed),
  on(EditActions.setSelectedEditFeature, onSetSelectedEditFeature),
  on(EditActions.setLoadedEditFeature, onSetLoadedEditFeature),
  on(EditActions.showEditDialog, onShowEditDialog),
  on(EditActions.hideEditDialog, onHideEditDialog),
  on(EditActions.expandCollapseEditDialog, onExpandCollapseEditDialog),
  on(EditActions.updateEditFeature, onUpdateEditFeature),
  on(EditActions.editNewlyCreatedFeature, onEditNewlyCreatedFeature),
);
export const editReducer = (state: EditState | undefined, action: Action) => editReducerImpl(state, action);
