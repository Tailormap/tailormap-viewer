import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';
import { MapStyleModel } from "../map-style.model";

export interface ModifyEnableToolArguments {
  geometry: string;
  style?: MapStyleModel;
}

export interface ModifyToolModel extends ToolModel {
  enable(enableArgs: ModifyEnableToolArguments): void;
  featureModified$: Observable<string>;
}
