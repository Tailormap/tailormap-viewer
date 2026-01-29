import {
  AttributeListApiServiceModel, GetFeaturesParams, GetLayerExportCapabilitiesParams, GetLayerExportParams,
  GetUniqueValuesParams,
} from '../models/attribute-list-api-service.model';
import { inject, Injectable } from '@angular/core';
import { FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, UniqueValuesService } from '@tailormap-viewer/api';
import { map, Observable } from 'rxjs';
import { FileHelper } from '@tailormap-viewer/shared';
import { FeaturesFilterHelper } from '../../../filter';

@Injectable({
  providedIn: 'root',
})
export class AttributeListApiService implements AttributeListApiServiceModel {

  private api = inject(TAILORMAP_API_V1_SERVICE);
  private uniqueValuesService = inject(UniqueValuesService);

  public getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel> {
    const { filter, ...getFeatureParams } = params;
    // Convert filter to CQL
    // Currently TM only supports filters on the layer itself, not related feature types
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(filter) || undefined
      : undefined;
    return this.api.getFeatures$({ ...getFeatureParams, filter: cqlFilter })
      .pipe(map((response): FeaturesResponseModel => {
        return {
          ...response,
          page: response.page ? response.page : null,
        };
      }));
  }

  public getLayerExportCapabilities$(params: GetLayerExportCapabilitiesParams) {
    return this.api.getLayerExportCapabilities$(params);
  }

  public getLayerExport$(params: GetLayerExportParams) {
    const { sortBy, sortOrder, filter, ...exportParams } = params;
    const sort = sortBy && sortOrder ? { column: sortBy, direction: sortOrder } : null;
    // Convert filter to CQL
    // Currently TM only supports filters on the layer itself, not related feature types
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(filter) || undefined
      : undefined;
    return this.api.getLayerExport$({ ...exportParams, sort, filter: cqlFilter })
      .pipe(map(response => {
        if (!response || !response.body) {
          return null;
        }
        const fileName = FileHelper.extractFileNameFromContentDispositionHeader(response.headers.get('Content-Disposition') || '', '');
        return {
          file: response.body,
          fileName,
        };
      }));
  }

  public getUniqueValues$(params: GetUniqueValuesParams) {
    const { filter, ...getUniqueValueParams } = params;
    // Convert filter to CQL
    // Currently TM only supports filters on the layer itself, not related feature types
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(filter) || undefined
      : undefined;
    return this.uniqueValuesService.getUniqueValues$({ ...getUniqueValueParams, filter: cqlFilter });
  }

}
