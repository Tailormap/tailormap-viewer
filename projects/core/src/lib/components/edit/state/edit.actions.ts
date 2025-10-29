import { createAction, props } from '@ngrx/store';
import { FeatureInfoResponseModel } from '../../feature-info/models/feature-info-response.model';
import { FeatureModel } from '@tailormap-viewer/api';
import { FeatureInfoColumnMetadataModel } from "../../feature-info/models/feature-info-column-metadata.model";
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { DrawingType } from '@tailormap-viewer/map';

const editActionsPrefix = '[Edit]';

export const setEditActive = createAction(
  `${editActionsPrefix} Set Active`,
  props<{ active: boolean }>(),
);

export const setEditCreateNewFeatureActive = createAction(
  `${editActionsPrefix} Set Create New Feature Active`,
  props<{ active: boolean; geometryType: DrawingType; columnMetadata: FeatureInfoColumnMetadataModel[] }>(),
);

export const setEditCopyOtherLayerFeaturesActive = createAction(
  `${editActionsPrefix} Set Copy Other Layer Features Active`,
  props<{ active: boolean; layerId: string; columnMetadata: FeatureInfoColumnMetadataModel[] }>(),
);

export const setSelectedEditLayer = createAction(
  `${editActionsPrefix} Set Selected Layer`,
  props<{ layer: string | null }>(),
);

export const loadEditFeatures = createAction(
  `${editActionsPrefix} Load Edit Features`,
  props<{ coordinates: [number, number]; mouseCoordinates: [number, number]; pointerType?: string }>(),
);

export const loadCopyFeatures = createAction(
  `${editActionsPrefix} Load Copy Features`,
  props<{ coordinates: [number, number]; mouseCoordinates: [number, number]; pointerType?: string }>(),
);

export const loadEditFeaturesSuccess = createAction(
  `${editActionsPrefix} Load Edit Features Success`,
  props<{ featureInfo: FeatureInfoResponseModel[] }>(),
);

export const loadEditFeaturesFailed = createAction(
  `${editActionsPrefix} Load Edit Features Failed`,
  props<{ errorMessage?: string }>(),
);

export const loadCopyFeaturesSuccess = createAction(
  `${editActionsPrefix} Load Copy Features Success`,
  props<{ featureInfo: FeatureInfoResponseModel[] }>(),
);

export const loadCopyFeaturesFailed = createAction(
  `${editActionsPrefix} Load Copy Features Failed`,
  props<{ errorMessage?: string }>(),
);

export const setSelectedEditFeature = createAction(
    `${editActionsPrefix} Set Selected Edit Feature`,
    props<{ fid: string | null }>(),
);

export const setLoadedEditFeature = createAction(
  `${editActionsPrefix} Set Loaded Edit Feature`,
  props<{ feature: FeatureInfoFeatureModel; columnMetadata: FeatureInfoColumnMetadataModel[]; openedFromFeatureInfo?: boolean }>(),
);

export const showEditDialog = createAction(`${editActionsPrefix} Show Edit Dialog`);
export const hideEditDialog = createAction(`${editActionsPrefix} Hide Edit Dialog`);
export const expandCollapseEditDialog = createAction(`${editActionsPrefix} Expand/Collapse Edit Dialog`);

export const updateEditFeature = createAction(
  `${editActionsPrefix} Update Feature`,
  props<{ feature: FeatureModel; layerId: string }>(),
);

export const editNewlyCreatedFeature = createAction(
  `${editActionsPrefix} Edit Newly Created Feature`,
  props<{ feature: FeatureInfoFeatureModel }>(),
);
