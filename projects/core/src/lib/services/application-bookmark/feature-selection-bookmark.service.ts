import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FilterGroupModel, AttributeFilterModel, TAILORMAP_API_V1_SERVICE, FeaturesResponseModel } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';
import { selectLayers, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map';
import { selectViewerId, selectViewerLoadingState } from '../../state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { catchError, combineLatest, concatMap, first, forkJoin, map, of, take } from 'rxjs';
import { CqlFilterHelper, FeaturesFilterHelper } from '../../filter';
import { featureInfoLoaded, reopenFeatureInfoDialog, setFeatureInfoLayers } from '../../components/feature-info/state/feature-info.actions';
import { FeatureInfoFeatureModel, FeatureInfoResponseModel } from '../../components';
import { FeatureStylingHelper } from '../../shared';

@Injectable({
  providedIn: 'root',
})
export class FeatureSelectionBookmarkService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private api = inject(TAILORMAP_API_V1_SERVICE);

  private currentFilterGroupId: string | null = null;

  public clearFilter(): void {
    if (this.currentFilterGroupId) {
      this.store$.dispatch(removeFilterGroup({ filterGroupId: this.currentFilterGroupId }));
      this.currentFilterGroupId = null;
    }
  }

  public applyFilter(filterGroup: FilterGroupModel<AttributeFilterModel>, createFilter: boolean, isEmbedded: boolean): void {
    this.currentFilterGroupId = filterGroup.id;
    if (createFilter) {
      this.store$.dispatch(addFilterGroup({ filterGroup }));
    }
    this.getAndZoomToFeatures(filterGroup, isEmbedded);
  }

  private getAndZoomToFeatures(filterGroup: FilterGroupModel<AttributeFilterModel>, isEmbedded: boolean): void {
    combineLatest([
      this.store$.select(selectViewerId),
      this.store$.select(selectLayers),
    ]).pipe(
      take(1),
      concatMap(([applicationId, layers]) => {
        if (!applicationId || !layers) {
          return [];
        }
        // Get the CQL filters from the filter group for each layer
        const featuresFilters = CqlFilterHelper.getFilters([filterGroup]);

        if (!isEmbedded) {
          this.setFeatureInfoLayers(filterGroup.layerIds);
        }

        const featureRequests$ = filterGroup.layerIds.map(layerId => {
          const layer = layers.find(l => l.id === layerId);
          if (!layer) {
            return of([]);
          }

          // Get the filter for this layer
          const layerFilters = featuresFilters.get(layerId);
          const cqlFilter =  layerFilters
            ? FeaturesFilterHelper.getFilter(layerFilters) || undefined
            : undefined;

          // Call the API to get features
          return this.api.getFeatures$({
            applicationId: applicationId,
            layerId: layerId,
            filter: cqlFilter || undefined,
            page: 1,
            geometryInAttributes: true,
          }).pipe(
            map(response => this.mapToFeatureInfoResponse(response, layerId)),
            catchError(() => of<FeatureInfoResponseModel>(this.createEmptyResponse(layerId))),
          );
        });

        return forkJoin(featureRequests$).pipe(
          map(results => results.flat()), // Combine all features from all layers
        );
      }),
    ).subscribe(responses => {
      // Zoom to all features
      const allFeatures: FeatureInfoFeatureModel[] = responses.flatMap(r => r.features);
      if (allFeatures.length > 0) {
        this.mapService.zoomToFeatures(allFeatures);
      }

      // Dispatch feature info loaded actions for each layer
      if (!isEmbedded) {
        responses.forEach(response => {
          this.store$.dispatch(featureInfoLoaded({
            featureInfo: response,
          }));
        });
        this.store$.dispatch(reopenFeatureInfoDialog());
      } else {
      }
    });
  }

  private mapToFeatureInfoResponse(
    response: FeaturesResponseModel,
    layerId: string,
  ): FeatureInfoResponseModel {
    return {
      features: (response.features || []).map(f => ({ ...f, layerId })),
      columnMetadata: (response.columnMetadata || []).map(cm => ({ ...cm, layerId })),
      attachmentMetadata: (response.attachmentMetadata || []).map(am => ({ ...am, layerId })),
      template: response.template || null,
      layerId,
    };
  }

  private createEmptyResponse(layerId: string): FeatureInfoResponseModel {
    return {
      features: [],
      columnMetadata: [],
      attachmentMetadata: [],
      template: null,
      layerId,
    };
  }

  private setFeatureInfoLayers(layerIds: string[]) {
    this.store$.select(selectVisibleLayersWithAttributes)
      .pipe(take(1))
      .subscribe(layers => {
        const featureInfoLayers = layers
          .filter(layer => layerIds.includes(layer.id))
          .map(layer => ({
            id: layer.id,
            title: layer.title,
            loading: LoadingStateEnum.LOADING,
          }));
        this.store$.dispatch(setFeatureInfoLayers({ layers: featureInfoLayers }));
      });
  }
}
