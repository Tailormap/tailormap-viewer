import { createAction, props } from '@ngrx/store';
import { FeatureInfoResponseModel } from '../models/feature-info-response.model';

const featureInfoActionsPrefix = '[Feature Info]';

export const loadFeatureInfo = createAction(
  `${featureInfoActionsPrefix} Load Feature Info`,
  props<{ mouseCoordinates: [number, number]; mapCoordinates: [number, number] }>(),
);

export const loadFeatureInfoSuccess = createAction(
  `${featureInfoActionsPrefix} Load Feature Info Success`,
  props<{ featureInfo: FeatureInfoResponseModel[] }>(),
);

export const loadFeatureInfoFailed = createAction(
  `${featureInfoActionsPrefix} Load Feature Info Failed`,
  props<{ errorMessage?: string }>(),
);

export const showFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Show Feature Info Dialog`);
export const hideFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Hide Feature Info Dialog`);
export const expandCollapseFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Expand/Collapse Feature Info Dialog`);
export const showNextFeatureInfoFeature = createAction(`${featureInfoActionsPrefix} Show Next Feature Info Feature`);
export const showPreviousFeatureInfoFeature = createAction(`${featureInfoActionsPrefix} Show Previous Feature Info Feature`);
