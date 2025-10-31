import {
  AttributeListApiServiceModel, GetFeaturesParams, GetLayerExportCapabilitiesParams, GetLayerExportParams,
} from '../models/attribute-list-api-service.model';
import { inject, Injectable } from '@angular/core';
import { TAILORMAP_API_V1_SERVICE, UniqueValueParams, UniqueValuesService } from '@tailormap-viewer/api';

@Injectable({
  providedIn: 'root',
})
export class AttributeListApiService implements AttributeListApiServiceModel {

  private api = inject(TAILORMAP_API_V1_SERVICE);
  private uniqueValuesService = inject(UniqueValuesService);

  public getFeatures$(params: GetFeaturesParams) {
    return this.api.getFeatures$(params);
  }

  public getLayerExportCapabilities$(params: GetLayerExportCapabilitiesParams) {
    return this.api.getLayerExportCapabilities$(params);
  }

  public getLayerExport$(params: GetLayerExportParams) {
    return this.api.getLayerExport$(params);
  }

  public getUniqueValues$(params: UniqueValueParams) {
    return this.uniqueValuesService.getUniqueValues$(params);
  }

}
