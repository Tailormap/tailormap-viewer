import {
  FeaturesResponseModel, LayerExportCapabilitiesModel, Sortorder, UniqueValueParams, UniqueValuesResponseModel,
} from '@tailormap-viewer/api';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export interface GetFeaturesParams {
  applicationId: string;
  layerId: string;
  __fid?: string;
  filter?: string;
  page?: number;
  sortBy?: string;
  sortOrder?: Sortorder;
  includeGeometry?: boolean;
}

export interface GetLayerExportCapabilitiesParams {
  applicationId: string;
  layerId: string;
}

export interface GetLayerExportParams {
  applicationId: string;
  layerId: string;
  outputFormat: string;
  filter?: string;
  sort: { column: string; direction: string} | null;
  attributes?: string[];
  crs?: string;
}

export interface AttributeListApiServiceModel {

  getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel>;

  getLayerExportCapabilities$(params: GetLayerExportCapabilitiesParams): Observable<LayerExportCapabilitiesModel>;

  getLayerExport$(params: GetLayerExportParams): Observable<HttpResponse<Blob>>;

  getUniqueValues$(params: UniqueValueParams): Observable<UniqueValuesResponseModel>;

}
