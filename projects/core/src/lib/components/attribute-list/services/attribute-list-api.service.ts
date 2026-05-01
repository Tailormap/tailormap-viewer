import {
  AttributeListApiServiceModel, DownloadLayerExtractParams, GetFeaturesParams, GetLayerExtractCapabilitiesParams, GetLayerExtractParams,
  GetUniqueValuesParams,
} from '../models/attribute-list-api-service.model';
import { inject, Injectable } from '@angular/core';
import { FeaturesResponseModel, LayerExtractResponseModel, TAILORMAP_API_V1_SERVICE, UniqueValuesService } from '@tailormap-viewer/api';
import { map, Observable } from 'rxjs';
import { FileHelper } from '@tailormap-viewer/shared';
import { FeaturesFilterHelper } from '../../../filter';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectIsLoadingTabs, selectTabsForVisibleLayers } from '../state/attribute-list.selectors';

@Injectable({
  providedIn: 'root',
})
export class AttributeListApiService implements AttributeListApiServiceModel {

  private api = inject(TAILORMAP_API_V1_SERVICE);
  private uniqueValuesService = inject(UniqueValuesService);
  private store$ = inject(Store);
  private attributeListManagerService = inject(AttributeListManagerService);

  public initDefaultAttributeListSource(): void {
    this.attributeListManagerService.addAttributeListSource({
      id: ATTRIBUTE_LIST_DEFAULT_SOURCE,
      tabs$: this.store$.select(selectTabsForVisibleLayers),
      isLoadingTabs$: this.store$.select(selectIsLoadingTabs),
      dataLoader: this,
    });
  }

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

  public getLayerExtractCapabilities$(params: GetLayerExtractCapabilitiesParams) {
    return this.api.getLayerExtractFormats$(params);
  }

  public startLayerExtract$(params: GetLayerExtractParams): Observable<LayerExtractResponseModel> {
    const { sortBy, sortOrder, filter, ...exportParams } = params;
    const sort = sortBy && sortOrder ? { column: sortBy, direction: sortOrder } : null;
    // Convert filter to CQL
    const cqlFilter = filter ? FeaturesFilterHelper.getFilter(filter) || undefined : undefined;
    return this.api.requestLayerExtract$({ ...exportParams, sort, filter: cqlFilter })
      .pipe(map(response => {
        return response;
      }));
  }

  public downloadLayerExtract$(params: DownloadLayerExtractParams): Observable<Blob | null> {
    return this.api.downloadLayerExtract$(params).pipe(map(response => {
      if (response && response.body) {
        const fileName = FileHelper.extractFileNameFromContentDispositionHeader(response.headers.get('Content-Disposition') || 'extract');
        FileHelper.saveAsFile(response.body, fileName);
        return response.body;
      }
      return null;
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
