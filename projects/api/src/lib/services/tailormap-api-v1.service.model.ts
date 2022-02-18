import { AppLayerModel, AppResponseModel, ComponentModel, LayerDetailsModel, MapResponseModel, VersionResponseModel } from '../models';
import { Observable } from 'rxjs';
import { FeaturesResponseModel } from '../models/features-response.model';

export interface TailormapApiV1ServiceModel {

  getVersion$(): Observable<VersionResponseModel>;

  getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<AppResponseModel>;

  getMap$(applicationId: number): Observable<MapResponseModel>;

  getComponents$(applicationId: number): Observable<ComponentModel[]>;

  getLayers$(applicationId: number): Observable<AppLayerModel[]>;

  getDescribeLayer$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel>;

  getFeatures$(params: {
    applicationId: number;
    layerId: number;
    x?: number;
    y?: number;
    distance?: number;
    __fid?: string;
    simplify?: boolean;
    filter?: string;
  }): Observable<FeaturesResponseModel>;

}
