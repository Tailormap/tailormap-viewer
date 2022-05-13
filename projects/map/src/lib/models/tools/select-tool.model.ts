import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';

export interface SelectToolModel<A extends FeatureModelAttributes = FeatureModelAttributes> extends ToolModel {
  selectedFeatures$: Observable<Array<FeatureModel<A> | null> | null>;
}
