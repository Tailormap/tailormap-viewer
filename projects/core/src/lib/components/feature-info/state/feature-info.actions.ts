import { createAction, props } from '@ngrx/store';
import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';

const featureInfoActionsPrefix = '[Feature Info]';

export const loadFeatureInfo = createAction(
  `${featureInfoActionsPrefix} Load Feature Info`,
  props<{ mouseCoordinates: [number, number]; mapCoordinates: [number, number]; layers: FeatureInfoLayerModel[] }>(),
);

export const featureInfoLoaded = createAction(
  `${featureInfoActionsPrefix} Load Feature Info Success`,
  props<{ featureInfo: FeatureInfoResponseModel }>(),
);

export const setSelectedFeatureInfoLayer = createAction(
  `${featureInfoActionsPrefix} Set Selected Layer`,
  props<{ layer: string }>(),
);

export const hideFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Hide Feature Info Dialog`);
export const expandCollapseFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Expand/Collapse Feature Info Dialog`);
export const expandCollapseFeatureInfoLayerList = createAction(`${featureInfoActionsPrefix} Expand/Collapse Feature Info Layer List`);
export const showNextFeatureInfoFeature = createAction(`${featureInfoActionsPrefix} Show Next Feature Info Feature`);
export const showPreviousFeatureInfoFeature = createAction(`${featureInfoActionsPrefix} Show Previous Feature Info Feature`);
