import { ViewerResponseModel, LayerDetailsModel, MapResponseModel, Sortorder, VersionResponseModel } from '../models';
import { Observable } from 'rxjs';
import { FeaturesResponseModel } from '../models/features-response.model';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import { UserResponseModel } from '../models/user-response.model';
import { LayerExportCapabilitiesModel } from '../models/layer-export-capabilities.model';
import { HttpResponse } from '@angular/common/http';

export interface TailormapApiV1ServiceModel {

  getVersion$(): Observable<VersionResponseModel>;

  getUser$(): Observable<UserResponseModel>;

  getViewer$(params: {
    kind?: string,
    name?: string;
  }): Observable<ViewerResponseModel>;

  getApplication$(params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<ViewerResponseModel>;

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
    onlyGeometries?: boolean;
  }): Observable<FeaturesResponseModel>;

  getUniqueValues$(params: {
    applicationId: number;
    layerId: number;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel>;

  getLayerExportCapabilities$(params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerExportCapabilitiesModel>;

  getLayerExport$(params: {
    applicationId: number;
    layerId: number;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>>;

}
