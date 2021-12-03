import { AppLayerModel, AppResponseModel, ComponentModel, LayerDetailsModel, MapResponseModel } from '../models';
import { Observable } from 'rxjs';

export interface TailormapApiV1ServiceModel {

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
  }): Observable<LayerDetailsModel[]>;

}
