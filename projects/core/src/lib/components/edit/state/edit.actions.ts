import { createAction, props } from '@ngrx/store';
import { FeatureInfoResponseModel } from '../../feature-info/models/feature-info-response.model';
import { FeatureModel } from '@tailormap-viewer/api';
import { FeatureInfoColumnMetadataModel } from "../../feature-info/models/feature-info-column-metadata.model";

const editActionsPrefix = '[Edit]';

export const setEditActive = createAction(
  `${editActionsPrefix} Set Active`,
  props<{ active: boolean }>(),
);

export const setEditCreateNewFeatureActive = createAction(
  `${editActionsPrefix} Set Create New Feature Active`,
  props<{ active: boolean; columnMetadata: FeatureInfoColumnMetadataModel[] }>(),
);

export const setSelectedEditLayer = createAction(
  `${editActionsPrefix} Set Selected Layer`,
  props<{ layer: string | null }>(),
);

export const loadEditFeatures = createAction(
  `${editActionsPrefix} Load Edit Features`,
  props<{ coordinates: [number, number] }>(),
);

export const loadEditFeaturesSuccess = createAction(
  `${editActionsPrefix} Load Edit Features Success`,
  props<{ featureInfo: FeatureInfoResponseModel[] }>(),
);

export const loadEditFeaturesFailed = createAction(
  `${editActionsPrefix} Load Edit Features Failed`,
  props<{ errorMessage?: string }>(),
);

export const setSelectedEditFeature = createAction(
    `${editActionsPrefix} Set Selected Edit Feature`,
    props<{ fid: string | null }>(),
);

export const showEditDialog = createAction(`${editActionsPrefix} Show Edit Dialog`);
export const hideEditDialog = createAction(`${editActionsPrefix} Hide Edit Dialog`);
export const expandCollapseEditDialog = createAction(`${editActionsPrefix} Expand/Collapse Edit Dialog`);

export const updateEditFeature = createAction(
  `${editActionsPrefix} Update Feature`,
  props<{ feature: FeatureModel; layerId: string }>(),
);
