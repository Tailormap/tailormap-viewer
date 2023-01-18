import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  AppResponseModel, FeaturesResponseModel, LayerDetailsModel, MapResponseModel, Sortorder, UserResponseModel, VersionResponseModel,
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

  public getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<AppResponseModel> {
    return this.httpClient.get<AppResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/app`,
      { params: this.getQueryParams({ id: params.id, name: params.name, version: params.version }) },
    );
  }

  public getMap$(applicationId: number): Observable<MapResponseModel> {
    return this.httpClient.get<MapResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/app/${applicationId}/map`,
    );
  }

  public getDescribeLayer$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel> {
    return this.httpClient.get<LayerDetailsModel>(
      `${TailormapApiV1Service.BASE_URL}/app/${params.applicationId}/layer/${params.layerId}/describe`,
    );
  }

  public getFeatures$(params: {
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
      `${TailormapApiV1Service.BASE_URL}/app/${params.applicationId}/layer/${params.layerId}/features`,
      params.filter ? this.getQueryParams({ filter:  params.filter }) : '',
      {
        headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded'),
        params: queryParams,
      });
  }

  public getUniqueValues$(params: {
    applicationId: number;
    layerId: number;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return this.httpClient.post<UniqueValuesResponseModel>(
      `${TailormapApiV1Service.BASE_URL}/app/${params.applicationId}/layer/${params.layerId}/unique/${params.attribute}`,
      params.filter ? this.getQueryParams({ filter: params.filter }) : '',
      { headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded') },
    );
  }

  public getLayerExportCapabilities$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerExportCapabilitiesModel> {
    return this.httpClient.get<LayerExportCapabilitiesModel>(
      `${TailormapApiV1Service.BASE_URL}/app/${params.applicationId}/layer/${params.layerId}/export/capabilities`,
    );
  }

  public getLayerExportUrl(params: {
    applicationId: number;
    layerId: number;
    outputFormat: string;
    filter?: string;
  }): string {
    // Can't use new URL() because that needs a scheme
    const url = `${TailormapApiV1Service.BASE_URL}/app/${params.applicationId}/layer/${params.layerId}/export/download`;
    const searchParams = new URLSearchParams();
    searchParams.append('outputFormat', params.outputFormat);
    if (params.filter) {
      searchParams.append('filter', params.filter);
    }
    return url + '?' + searchParams.toString();
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
