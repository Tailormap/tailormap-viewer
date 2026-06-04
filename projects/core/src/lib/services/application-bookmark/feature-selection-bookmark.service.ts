import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  FilterGroupModel, AttributeFilterModel, TAILORMAP_API_V1_SERVICE, FeaturesResponseModel, FeatureModel, FeatureModelAttributes,
} from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';
import { selectLayers, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map';
import { selectViewerId, selectViewerLoadingState } from '../../state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { catchError, combineLatest, concatMap, filter, first, forkJoin, map, Observable, of, take } from 'rxjs';
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
    if (isEmbedded) {
      const featureGeometries$: Observable<FeatureModel> = this.getFeatures$(filterGroup)
        .pipe(
          concatMap(responses => responses.flatMap(response => response.featuresResponse.features)),
        );
      this.mapService.renderFeatures$(
        'feature-selection-layer',
        featureGeometries$,
        FeatureStylingHelper.getDefaultHighlightStyle('attribute-list-highlight-style'),
        { zoomToFeature: true },
      )
    } else {
      this.getFeaturesAndAddToFeatureInfo(filterGroup);
    }
  }

  private getFeatures$(filterGroup: FilterGroupModel<AttributeFilterModel>): Observable<{ layerId: string, featuresResponse: FeaturesResponseModel }[]> {
    return combineLatest([
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
            map(featuresResponse => ({ layerId, featuresResponse })),
            catchError(() => of([])),
          );
        });

        return forkJoin(featureRequests$).pipe(
          map(results => results.flat()), // Combine all features from all layers
        );
      }),
    )
  }

  private getFeaturesAndAddToFeatureInfo(filterGroup: FilterGroupModel<AttributeFilterModel>) {
    this.setFeatureInfoLayers(filterGroup.layerIds);
    this.getFeatures$(filterGroup)
      .pipe(take(1))
      .subscribe((responses) => {
        const featureInfoResponses = responses
          .map(response => this.mapToFeatureInfoResponse(response.featuresResponse, response.layerId));

        featureInfoResponses.forEach(response => {
          this.store$.dispatch(featureInfoLoaded({
            featureInfo: response,
          }));
        });
        this.mapService.zoomToFeatures(featureInfoResponses.flatMap(r => r.features));
        this.store$.dispatch(reopenFeatureInfoDialog());
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
