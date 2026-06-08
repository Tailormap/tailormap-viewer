import { Observable } from 'rxjs';
import { FeaturesResponseModel } from '@tailormap-viewer/api';
import { GetFeaturesParams } from './get-features-param.model';

export interface GetFeaturesApiModel {
  getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel>;
}
