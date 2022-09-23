import { Injectable } from '@angular/core';
import { AppResponseModel, ComponentModel, LayerDetailsModel, MapResponseModel, VersionResponseModel } from '../models';
import { delay, Observable, of } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { FeaturesResponseModel } from '../models/features-response.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import {
  getAppResponseData, getComponentModel, getFeaturesResponseModel, getLayerDetailsModel, getMapResponseData,
  getUniqueValuesResponseModel,
  getVersionResponseModel,
} from '../mock-data';

@Injectable()
export class TailormapApiV1MockService implements TailormapApiV1ServiceModel {

  public getVersion$(): Observable<VersionResponseModel> {
    return of(getVersionResponseModel());
  }

  public getApplication$(_params: { name?: string; version?: string; id?: number }): Observable<AppResponseModel> {
    return of(getAppResponseData());
  }

  public getMap$(_applicationId: number): Observable<MapResponseModel> {
    return of(getMapResponseData());
  }

  public getComponents$(_applicationId: number): Observable<ComponentModel[]> {
    return of([getComponentModel()]);
  }

  public getDescribeLayer$(_params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel> {
    return of(getLayerDetailsModel());
  }

  public getFeatures$(_params: {
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
  }): Observable<FeaturesResponseModel> {
    return of(getFeaturesResponseModel()).pipe(delay(3000));
  }

  public getUniqueValues$(_params: {
    applicationId: number;
    layerId: number;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return of(getUniqueValuesResponseModel());
  }

}
