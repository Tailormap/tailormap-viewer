import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpStatusCode } from '@angular/common/http';
import {
  ViewerResponseModel, FeaturesResponseModel, LayerDetailsModel, MapResponseModel, Sortorder, VersionResponseModel,
  FeatureModel, ConfigResponseModel, SearchResponseModel,
} from '../models';
import { map, Observable } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';
import { ApiHelper } from '../helpers/api.helper';
import { TailormapApiConstants } from './tailormap-api.constants';

@Injectable()
export class TailormapApiV1Service implements TailormapApiV1ServiceModel {
  private httpClient = inject(HttpClient);


  public getVersion$(): Observable<VersionResponseModel> {
    return this.httpClient.get<VersionResponseModel>(
      `${TailormapApiConstants.BASE_URL}/version`,
    );
  }

  public getViewer$(id?: string): Observable<ViewerResponseModel> {
    return this.httpClient.get<ViewerResponseModel>(
      TailormapApiConstants.BASE_URL + '/' + (id || 'app'),
    );
  }

  public getMap$(applicationId: string): Observable<MapResponseModel> {
    return this.httpClient.get<MapResponseModel>(
      `${TailormapApiConstants.BASE_URL}/${applicationId}/map`,
    );
  }

  public getDescribeLayer$(params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerDetailsModel> {
    return this.httpClient.get<LayerDetailsModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/describe`,
    );
  }

  public getFeatures$(params: {
    applicationId: string;
    layerId: string;
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
    geometryInAttributes?: boolean;
  }): Observable<FeaturesResponseModel> {
    const queryParams = ApiHelper.getQueryParams({
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
      geometryInAttributes: params.geometryInAttributes,
    });
    return this.httpClient.post<FeaturesResponseModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/features`,
      params.filter ? this.getQueryParams({ filter:  params.filter }) : '',
      {
        headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded'),
        params: queryParams,
      });
  }

    public deleteFeature$(params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<HttpStatusCode> {
        return this.httpClient.delete<HttpResponse<Response>>(
            `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/edit/feature/${params.feature.__fid}`,
            { observe: 'response' },
        ).pipe(
            map(response => {
                    return response.status as HttpStatusCode;
                },
            ),
        );
    }

  public createFeature$(params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<FeatureModel> {
   return this.httpClient.post<FeatureModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/edit/feature`,
      params.feature,
    );
  }

  public updateFeature$(params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<FeatureModel> {
    return this.httpClient.patch<FeatureModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/edit/feature/${params.feature.__fid}`,
      params.feature,
    );
  }

  public getUniqueValues$(params: {
    applicationId: string;
    layerId: string;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return this.httpClient.post<UniqueValuesResponseModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/unique/${params.attribute}`,
      params.filter ? this.getQueryParams({ filter: params.filter }) : '',
      { headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded') },
    );
  }

  public getLayerExportCapabilities$(params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerExportCapabilitiesModel> {
    return this.httpClient.get<LayerExportCapabilitiesModel>(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/export/capabilities`,
    );
  }

  public getLayerExport$(params: {
    applicationId: string;
    layerId: string;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>> {
    const queryParams = ApiHelper.getQueryParams({
      outputFormat: params.outputFormat,
      attributes: params.attributes?.join(','),
      sortBy: params.sort?.column,
      sortOrder: params.sort?.direction,
      crs: params.crs,
    });
    return this.httpClient.post(
      `${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/export/download`,
      params.filter ? this.getQueryParams({ filter: params.filter }) : '',
      {
        headers: new HttpHeaders('Content-Type: application/x-www-form-urlencoded'),
        params: queryParams,
        observe: 'response',
        responseType: 'blob',
      },
    );
  }

  public getConfig$<T>(key: string): Observable<ConfigResponseModel<T>> {
    return this.httpClient.get<ConfigResponseModel<T>>(`${TailormapApiConstants.BASE_URL}/config/${key}`);
  }

  public search$(params: {
    applicationId: string;
    layerId: string;
    query: string;
    start?: number;
  }): Observable<SearchResponseModel> {
    const queryParams = ApiHelper.getQueryParams({
      q: params.query,
      start: params.start,
    });
    return this.httpClient.get<SearchResponseModel>(`${TailormapApiConstants.BASE_URL}/${params.applicationId}/layer/${params.layerId}/search`, {
      params: queryParams,
    });
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
