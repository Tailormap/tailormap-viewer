import {
  FeaturesResponseModel, LayerExportCapabilitiesModel, Sortorder, UniqueValueParams, UniqueValuesResponseModel,
} from '@tailormap-viewer/api';
import { Observable } from 'rxjs';

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
  sortBy?: string;
  sortOrder?: Sortorder;
  attributes?: string[];
  crs?: string;
}

export interface GetLayerExportResponse {
  file: Blob;
  fileName: string;
}

export interface AttributeListApiServiceModel {

  getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel>;

  getLayerExportCapabilities$(params: GetLayerExportCapabilitiesParams): Observable<LayerExportCapabilitiesModel>;

  getLayerExport$(params: GetLayerExportParams): Observable<GetLayerExportResponse | null>;

  getUniqueValues$(params: UniqueValueParams): Observable<UniqueValuesResponseModel>;

}
