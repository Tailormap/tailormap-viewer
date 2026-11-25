import {
  AttributeListApiServiceModel, DownloadLayerExtractParams, DownloadLayerExtractResponse,
  GetLayerExtractCapabilitiesParams, GetLayerExtractParams,
  GetUniqueValuesParams, ZoomToExtentBoundsParams,
} from '../models/attribute-list-api-service.model';
import { inject, Injectable } from '@angular/core';
import {
  BoundsModel, FeaturesResponseModel, LayerExtractResponseModel, TAILORMAP_API_V1_SERVICE, UniqueValuesService,
} from '@tailormap-viewer/api';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { FileHelper } from '@tailormap-viewer/shared';
import { CqlFilterHelper } from '../../../filter';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectIsLoadingTabs, selectTabsForVisibleLayers } from '../state/attribute-list.selectors';
import { GetFeaturesParams } from '../../../models/get-features-param.model';

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
    const { filterGroups, ...getFeatureParams } = params;
    return this.api.getFeatures$({ ...getFeatureParams, filter: CqlFilterHelper.getCqlFilterForLayer(filterGroups, params.layerId) })
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
    const { sortBy, sortOrder, filterGroups, ...exportParams } = params;
    const sort = sortBy && sortOrder ? { column: sortBy, direction: sortOrder } : null;
    return this.api.requestLayerExtract$({ ...exportParams, sort, filter: CqlFilterHelper.getCqlFilterForLayer(filterGroups, params.layerId) })
      .pipe(map(response => {
        return response;
      }));
  }

  public downloadLayerExtract$(params: DownloadLayerExtractParams): Observable<DownloadLayerExtractResponse | null> {
    return this.api.downloadLayerExtract$(params).pipe(map(response => {
      if (response && response.body) {
        const contentDispositionHeader = response.headers.get('Content-Disposition') || '';
        const fileName = FileHelper.extractFileNameFromContentDispositionHeader(contentDispositionHeader, 'extract');
        return { file: response.body, fileName };
      }
      return null;
    }));
  }

  public getUniqueValues$(params: GetUniqueValuesParams) {
    const { filterGroups, ...getUniqueValueParams } = params;
    return this.uniqueValuesService.getUniqueValues$({ ...getUniqueValueParams, filter: CqlFilterHelper.getCqlFilterForLayer(filterGroups, params.layerId) });
  }

  public retrieveZoomToExtentBounds$(params: ZoomToExtentBoundsParams): Observable<BoundsModel | null> {
    const { filterGroups, ...zoomParams } = params;
    return this.api.retrieveZoomToExtentBounds$({ ...zoomParams, filter: CqlFilterHelper.getCqlFilterForLayer(filterGroups, params.layerId) })
      .pipe(
        timeout(30000),
        map(bounds => bounds ?? null),
        catchError(() => {
          return of(null);
        }),
      );
  }

  public canCheckRows$(): Observable<boolean> {
    return of(false);
  }

}
