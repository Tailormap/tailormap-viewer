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

  getViewer$(id?: string): Observable<ViewerResponseModel>;

  getMap$(applicationId: string): Observable<MapResponseModel>;

  getDescribeLayer$(params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerDetailsModel>;

  getFeatures$(params: {
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
  }): Observable<FeaturesResponseModel>;

  getUniqueValues$(params: {
    applicationId: string;
    layerId: string;
    attribute: string;
    filter?: string;
  }): Observable<UniqueValuesResponseModel>;

  getLayerExportCapabilities$(params: {
    applicationId: string;
    layerId: string;
  }): Observable<LayerExportCapabilitiesModel>;

  getLayerExport$(params: {
    applicationId: string;
    layerId: string;
    outputFormat: string;
    filter?: string;
    sort: { column: string; direction: string} | null;
    attributes?: string[];
    crs?: string;
  }): Observable<HttpResponse<Blob>>;

}
