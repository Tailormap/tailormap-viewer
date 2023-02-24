import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import {
  ViewerResponseModel, FeaturesResponseModel, LayerDetailsModel, MapResponseModel, Sortorder, UserResponseModel, VersionResponseModel,
} from '../models';
import { Observable } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';

@Injectable()
export class TailormapApiV1Service implements TailormapApiV1ServiceModel {

  public static BASE_URL = '/api';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public getVersion$(): Observable<VersionResponseModel> {
    return this.httpClient.get<VersionResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/version`,
    );
  }

  public getUser$(): Observable<UserResponseModel> {
    return this.httpClient.get<UserResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/user`,
    );
  }

  public getViewer$(id?: string): Observable<ViewerResponseModel> {
    return this.httpClient.get<ViewerResponseModel>(
      TailormapApiV1Service.BASE_URL + '/' + (id || 'app'),
    );
  }

  public getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<ViewerResponseModel> {
    return this.httpClient.get<ViewerResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/app`,
      { params: this.getQueryParams({ id: params.id, name: params.name, version: params.version }) },
    );
  }

  public getMap$(applicationId: string): Observable<MapResponseModel> {
    return this.httpClient.get<MapResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/${applicationId}/map`,
    );
  }

  public getDescribeLayer$(params: {
    applicationId: string;
    layerId: number;
  }): Observable<LayerDetailsModel> {
    return this.httpClient.get<LayerDetailsModel>(
      `${TailormapApiV1Service.BASE_URL}/${params.applicationId}/layer/${params.layerId}/describe`,
    );
  }

  public getFeatures$(params: {
    applicationId: string;
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
    onlyGeometries?: boolean;
  }): Observable<FeaturesResponseModel> {
    const queryParams = this.getQueryParams({
      x: params.x,
      y: params.y,
      crs: params.crs,
      distance: params.distance,
      __fid: params.__fid,
      simplify: params.simplify,
      page: params.page,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      onlyGeometries: params.onlyGeometries,
    });
    return this.httpClient.post<FeaturesResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/${params.applicationId}/layer/${params.layerId}/features`,
      params.filter ? this.getQueryParams({ filter:  params.filter }) : '',
      {
        headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded'),
        params: queryParams,
      });
  }

  public getUniqueValues$(params: {
    applicationId: string;
    layerId: number;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return this.httpClient.post<UniqueValuesResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/${params.applicationId}/layer/${params.layerId}/unique/${params.attribute}`,
      params.filter ? this.getQueryParams({ filter: params.filter }) : '',
      { headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded') },
    );
  }

  public getLayerExportCapabilities$(params: {
    applicationId: string;
    layerId: number;
  }): Observable<LayerExportCapabilitiesModel> {
    return this.httpClient.get<LayerExportCapabilitiesModel>(
      `${TailormapApiV1Service.BASE_URL}/${params.applicationId}/layer/${params.layerId}/export/capabilities`,
    );
  }

  public getLayerExport$(params: {
    applicationId: string;
    layerId: number;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>> {
    const queryParams = this.getQueryParams({
      outputFormat: params.outputFormat,
      attributes: params.attributes?.join(','),
      sortBy: params.sort?.column,
      sortOrder: params.sort?.direction,
      crs: params.crs,
    });
    return this.httpClient.post(
      `${TailormapApiV1Service.BASE_URL}/${params.applicationId}/layer/${params.layerId}/export/download`,
      params.filter ? this.getQueryParams({ filter: params.filter }) : '',
      {
        headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded'),
        params: queryParams,
        observe: 'response',
        responseType: 'blob',
      },
    );
  }

  private getQueryParams(params: Record<string, string | number | boolean | undefined>): HttpParams {
    let queryParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (typeof value !== 'undefined') {
        queryParams = queryParams = queryParams.set(key, value);
      }
    });
    return queryParams;
  }

}
