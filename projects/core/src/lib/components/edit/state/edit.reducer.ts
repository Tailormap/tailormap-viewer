import * as EditActions from './edit.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { EditState, initialEditCopyState, initialEditState } from './edit.state';
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
  ...(payload.active ? {} : initialEditCopyState),
  dialogVisible: false,
  selectedFeature: null,
  openedFromFeatureInfo: false,
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
});

const onLoadCopyFeatureInfo = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadCopyFeatures>,
): EditState => ({
  ...state,
  mapCoordinates: payload.coordinates,
  loadStatus: LoadingStateEnum.LOADING,
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

const onLoadCopyFeaturesSuccess = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadCopyFeaturesSuccess>,
): EditState => {
  state = {
    ...state,
    loadStatus: LoadingStateEnum.LOADED,
  };
  const geometry = payload.featureInfo[0]?.features[0]?.geometry;
  if (!geometry) {
    return state;
  }

  // Deselect a feature by checking if the geometry WKT is already in the copiedFeatures array (can't search by fid)
  const sameGeometryIndex = state.copiedFeatures.findIndex(f => f.geometry === geometry);
  const copiedFeatures = sameGeometryIndex !== -1
    ? state.copiedFeatures.filter((_, idx) => idx !== sameGeometryIndex)
    : [ ...state.copiedFeatures, payload.featureInfo[0].features[0] ];

  return {
    ...state,
    features: [{
      layerId: state.columnMetadata[0].layerId,
      __fid: 'new',
      attributes: {},
    }],
    copiedFeatures,
  };
};

const onSetCopyOtherLayerFeaturesActive = (
  state: EditState,
    payload: ReturnType<typeof EditActions.setEditCopyOtherLayerFeaturesActive>,
): EditState => ({
  ...state,
  isCopyOtherLayerFeaturesActive: true,
  isCreateNewFeatureActive: false,
  dialogVisible: true,
  dialogCollapsed: false,
  selectedCopyLayer: payload.layerId,
  columnMetadata: payload.columnMetadata,
  // Do not reset copiedFeatures, so features from different layers can be copied
  selectedFeature: 'new',
  features: [{
    layerId: payload.columnMetadata[0].layerId,
    __fid: 'new',
    attributes: {},
  }],
  loadStatus: LoadingStateEnum.INITIAL,
});

const onSetCopyOtherLayerFeaturesDisabled = (
  state: EditState,
): EditState => ({
  ...state,
  isCreateNewFeatureActive: false,
  dialogVisible: false,
  dialogCollapsed: true,
  ...initialEditCopyState,
});

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
      ...initialEditCopyState,
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

const onLoadCopyFeaturesFailed = (
  state: EditState,
  payload: ReturnType<typeof EditActions.loadCopyFeaturesFailed>,
): EditState => ({
  ...state,
  errorMessage: payload.errorMessage,
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
    openedFromFeatureInfo: payload.openedFromFeatureInfo,
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
  ...initialEditCopyState,
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
    ...initialEditCopyState,
    features: [payload.feature],
    selectedFeature: payload.feature.__fid,
    isCreateNewFeatureActive: false,
  };
};

const editReducerImpl = createReducer<EditState>(
  initialEditState,
  on(EditActions.setEditActive, onSetIsActive),
  on(EditActions.setEditCopyOtherLayerFeaturesActive, onSetCopyOtherLayerFeaturesActive),
  on(EditActions.setEditCopyOtherLayerFeaturesDisabled, onSetCopyOtherLayerFeaturesDisabled),
  on(EditActions.setEditCreateNewFeatureActive, onSetCreateNewFeatureActive),
  on(EditActions.setSelectedEditLayer, onSetSelectedLayer),
  on(EditActions.loadEditFeatures, onLoadFeatureInfo),
  on(EditActions.loadCopyFeatures, onLoadCopyFeatureInfo),
  on(EditActions.loadEditFeaturesSuccess, onLoadEditFeaturesSuccess),
  on(EditActions.loadEditFeaturesFailed, onLoadEditFeaturesFailed),
  on(EditActions.loadCopyFeaturesSuccess, onLoadCopyFeaturesSuccess),
  on(EditActions.loadCopyFeaturesFailed, onLoadCopyFeaturesFailed),
  on(EditActions.setSelectedEditFeature, onSetSelectedEditFeature),
  on(EditActions.setLoadedEditFeature, onSetLoadedEditFeature),
  on(EditActions.showEditDialog, onShowEditDialog),
  on(EditActions.hideEditDialog, onHideEditDialog),
  on(EditActions.expandCollapseEditDialog, onExpandCollapseEditDialog),
  on(EditActions.updateEditFeature, onUpdateEditFeature),
  on(EditActions.editNewlyCreatedFeature, onEditNewlyCreatedFeature),
);
export const editReducer = (state: EditState | undefined, action: Action) => editReducerImpl(state, action);
