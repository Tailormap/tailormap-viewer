import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';
import { MapStyleModel } from "../map-style.model";
import { FeatureModel } from '@tailormap-viewer/api';

export interface ModifyEnableToolArguments {
  feature: FeatureModel;
  style?: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel);
}

export interface ModifyToolModel extends ToolModel {
  enable(enableArgs: ModifyEnableToolArguments): void;
  featureModified$: Observable<string>;
}
