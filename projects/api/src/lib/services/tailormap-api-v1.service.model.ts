import { AppResponseModel, LayerDetailsModel, MapResponseModel, Sortorder, VersionResponseModel } from '../models';
import { Observable } from 'rxjs';
import { FeaturesResponseModel } from '../models/features-response.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';

export interface TailormapApiV1ServiceModel {

  getVersion$(): Observable<VersionResponseModel>;

  getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<AppResponseModel>;

  getMap$(applicationId: number): Observable<MapResponseModel>;

  getDescribeLayer$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel>;

  getFeatures$(params: {
    applicationId: number;
    layerId: number;
    x?: number;
    y?: number;
    crs?: string;
    distance?: number;
    __fid?: string;
    simplify?: boolean;
    filter?: string;
    page?: number;
    sortBy?: string;
    sortOrder?: Sortorder;
  }): Observable<FeaturesResponseModel>;

  getUniqueValues$(params: {
    applicationId: number;
    layerId: number;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel>;

}
