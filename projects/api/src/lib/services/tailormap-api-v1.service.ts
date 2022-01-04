import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AppLayerModel, AppResponseModel, ComponentModel, LayerDetailsModel, MapResponseModel } from '../models';
import { Observable } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';

@Injectable()
export class TailormapApiV1Service implements TailormapApiV1ServiceModel {

  private static BASE_URL = '/api';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<AppResponseModel> {
    let queryParams = new HttpParams();
    if (params.id) {
      queryParams = queryParams.set('id', params.id);
    }
    if (params.name) {
      queryParams = queryParams.set('name', params.name);
    }
    if (params.version) {
      queryParams = queryParams.set('version', params.version);
    }
    return this.httpClient.get<AppResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/app`,
      { params: queryParams },
    );
  }

  public getMap$(applicationId: number): Observable<MapResponseModel> {
    return this.httpClient.get<MapResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/map/${applicationId}`,
    );
  }

  public getComponents$(applicationId: number): Observable<ComponentModel[]> {
    return this.httpClient.get<ComponentModel[]>(
      `${TailormapApiV1Service.BASE_URL}/components/${applicationId}`,
    );
  }

  public getLayers$(applicationId: number): Observable<AppLayerModel[]> {
    return this.httpClient.get<AppLayerModel[]>(
      `${TailormapApiV1Service.BASE_URL}/layers/${applicationId}`,
    );
  }

  public getDescribeLayer$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel> {
    return this.httpClient.get<LayerDetailsModel>(
      `${TailormapApiV1Service.BASE_URL}/describelayer/${params.applicationId}/${params.layerId}`,
    );
  }

}
