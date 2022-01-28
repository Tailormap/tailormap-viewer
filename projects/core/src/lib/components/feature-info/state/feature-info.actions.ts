import { createAction, props } from '@ngrx/store';
import { FeatureInfoModel } from '../models/feature-info.model';

const featureInfoActionsPrefix = '[Feature Info]';

export const loadFeatureInfo = createAction(
  `${featureInfoActionsPrefix} Load Feature Info`,
  props<{ mouseCoordinates: [number, number]; mapCoordinates: [number, number] }>(),
);

export const loadFeatureInfoSuccess = createAction(
  `${featureInfoActionsPrefix} Load Feature Info Success`,
  props<{ featureInfo: FeatureInfoModel[] }>(),
);

export const loadFeatureInfoFailed = createAction(
  `${featureInfoActionsPrefix} Load Feature Info Failed`,
  props<{ errorMessage?: string }>(),
);

export const showFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Show Feature Info Dialog`);
export const hideFeatureInfoDialog = createAction(`${featureInfoActionsPrefix} Hide Feature Info Dialog`);
