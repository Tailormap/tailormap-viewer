import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';
import { MapStyleModel } from "../map-style.model";
import { FeatureModel } from '@tailormap-viewer/api';

export interface ExtTransformEnableToolArguments {
  feature: FeatureModel;
  style?: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel);
}

export interface ExtTransformToolModel extends ToolModel {
  enable(enableArgs: ExtTransformEnableToolArguments): void;
  featureModified$: Observable<string>;
}
