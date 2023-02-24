import { Injectable } from '@angular/core';
import { ViewerResponseModel, LayerDetailsModel, MapResponseModel, UserResponseModel, VersionResponseModel } from '../models';
import { delay, Observable, of } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { FeaturesResponseModel } from '../models/features-response.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import {
  getViewerResponseData, getFeaturesResponseModel, getLayerDetailsModel, getMapResponseData,
  getUniqueValuesResponseModel,
  getVersionResponseModel, getUserResponseModel, getLayerExportCapabilitiesModel,
} from '../mock-data';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class TailormapApiV1MockService implements TailormapApiV1ServiceModel {

  public getVersion$(): Observable<VersionResponseModel> {
    return of(getVersionResponseModel());
  }

  public getUser$(): Observable<UserResponseModel> {
    return of(getUserResponseModel());
  }

  public getViewer$(_id?: string): Observable<ViewerResponseModel> {
    return of(getViewerResponseData());
  }
  public getMap$(_applicationId: string): Observable<MapResponseModel> {
    return of(getMapResponseData());
  }

  public getDescribeLayer$(_params: {
    applicationId: string;
    layerName: string;
  }): Observable<LayerDetailsModel> {
    return of(getLayerDetailsModel());
  }

  public getFeatures$(_params: {
    applicationId: string;
    layerName: string;
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
    applicationId: string;
    layerName: string;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return of(getUniqueValuesResponseModel());
  }

  public getLayerExportCapabilities$(_params: {
    applicationId: string;
    layerName: string;
  }): Observable<LayerExportCapabilitiesModel> {
    return of(getLayerExportCapabilitiesModel());
  }

  public getLayerExport$(_params: {
    applicationId: string;
    layerName: string;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>> {
    return of(new HttpResponse<Blob>({ body: new Blob(['']) }));
  }

}
