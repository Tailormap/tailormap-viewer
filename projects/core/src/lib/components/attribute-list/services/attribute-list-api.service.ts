import {
  AttributeListApiServiceModel, GetFeaturesParams, GetLayerExportCapabilitiesParams, GetLayerExportParams,
} from '../models/attribute-list-api-service.model';
import { inject, Injectable } from '@angular/core';
import { TAILORMAP_API_V1_SERVICE, UniqueValueParams, UniqueValuesService } from '@tailormap-viewer/api';
import { map } from 'rxjs';
import { FileHelper } from '@tailormap-viewer/shared';
import { FeaturesFilterHelper } from '../../../filter';

@Injectable({
  providedIn: 'root',
})
export class AttributeListApiService implements AttributeListApiServiceModel {

  private api = inject(TAILORMAP_API_V1_SERVICE);
  private uniqueValuesService = inject(UniqueValuesService);

  public getFeatures$(params: GetFeaturesParams) {
    const { filter, ...getFeatureParams } = params;
    // Convert filter to CQL - TM currently supports layer filters only, not related feature types
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(params.layerId, filter) || undefined
      : undefined;
    return this.api.getFeatures$({ ...getFeatureParams, filter: cqlFilter });
  }

  public getLayerExportCapabilities$(params: GetLayerExportCapabilitiesParams) {
    return this.api.getLayerExportCapabilities$(params);
  }

  public getLayerExport$(params: GetLayerExportParams) {
    const { sortBy, sortOrder, filter, ...exportParams } = params;
    const sort = sortBy && sortOrder ? { column: sortBy, direction: sortOrder } : null;
    // Convert filter to CQL - TM currently supports layer filters only, not related feature types
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(params.layerId, filter) || undefined
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

  public getUniqueValues$(params: UniqueValueParams) {
    return this.uniqueValuesService.getUniqueValues$(params);
  }

}
