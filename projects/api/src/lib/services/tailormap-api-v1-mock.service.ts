import { Injectable } from '@angular/core';
import {
  ViewerResponseModel, LayerDetailsModel, MapResponseModel, VersionResponseModel, FeatureModel, ConfigResponseModel,
  SearchResponseModel,
} from '../models';
import { delay, Observable, of } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { FeaturesResponseModel } from '../models/features-response.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import {
  getViewerResponseData, getFeaturesResponseModel, getLayerDetailsModel, getMapResponseData,
  getUniqueValuesResponseModel,
  getVersionResponseModel, getLayerExportCapabilitiesModel, getFeatureModel, getConfigModel,
} from '../mock-data';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';

@Injectable()
export class TailormapApiV1MockService implements TailormapApiV1ServiceModel {

  public getVersion$(): Observable<VersionResponseModel> {
    return of(getVersionResponseModel());
  }

  public getViewer$(_id?: string): Observable<ViewerResponseModel> {
    return of(getViewerResponseData());
  }

  public getMap$(_applicationId: string): Observable<MapResponseModel> {
    return of(getMapResponseData());
  }

  public getDescribeLayer$(_params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerDetailsModel> {
    return of(getLayerDetailsModel());
  }

  public getFeatures$(_params: {
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
  }): Observable<FeaturesResponseModel> {
    return of(getFeaturesResponseModel()).pipe(delay(3000));
  }

  public getUniqueValues$(_params: {
    applicationId: string;
    layerId: string;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel> {
    return of(getUniqueValuesResponseModel());
  }

  public getLayerExportCapabilities$(_params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerExportCapabilitiesModel> {
    return of(getLayerExportCapabilitiesModel());
  }

  public getLayerExport$(_params: {
    applicationId: string;
    layerId: string;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>> {
    return of(new HttpResponse<Blob>({ body: new Blob(['']) }));
  }

  public createFeature$(params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<FeatureModel> {
    return of(getFeatureModel({ "__fid": params.feature.__fid }));
  }

  public deleteFeature$(_params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<HttpStatusCode> {
    return of(HttpStatusCode.NoContent);
  }

  public updateFeature$(params: { applicationId: string; layerId: string; feature: FeatureModel }): Observable<FeatureModel> {
    return of(getFeatureModel({ "__fid": params.feature.__fid }));
  }

  public getConfig$<T>(key: string): Observable<ConfigResponseModel<T>> {
    return of(getConfigModel<T>({ key }));
  }

  public search$(_params: { applicationId: string; layerId: string; query: string; start?: number }): Observable<SearchResponseModel> {
    return of({ start: 0, documents: [], maxScore: 0, total: 0 });
  }

  public getLatestUpload$(category: string): Observable<any> {
    switch (category) {
      case 'drawing-style':
        return of({
          styles: [{
            'type': 'IMAGE', 'style': {
              'markerImage': 'https://snapshot.tailormap.nl/api/uploads/drawing-style-image/07d2f7aa-6eb1-442a-822d-896514a9bc0d/drinkwater.svg',
              'description': 'Drinkwater',
              'marker': 'circle',
              'markerSize': 11,
              'markerRotation': 0,
              'markerFillColor': 'rgb(0, 136, 85)',
              'markerStrokeColor': 'rgb(255, 255, 255)',
              'markerStrokeWidth': 1,
              'label': '',
              'labelSize': 8,
              'labelColor': 'rgb(0, 0, 0)',
              'labelOutlineColor': 'rgb(255, 255, 255)',
              'fillOpacity': 30,
              'strokeColor': 'rgb(98, 54, 255)',
              'strokeWidth': 3,
              'strokeOpacity': 100,
              'fillColor': 'rgb(98, 54, 255)',
            },
          }],
        });
      default:
        // return a 404 error by default
        return of(new HttpErrorResponse({
          error: '{"message":"Not Found"}',
          status: HttpStatusCode.NotFound,
          statusText: 'Not Found',
        }));
    }
  }
}
