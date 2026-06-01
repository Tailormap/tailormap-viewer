import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FilterGroupModel, AttributeFilterModel } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';
import { selectLayers, selectLoadStatus } from '../../map';
import { selectViewerId, selectViewerLoadingState } from '../../state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { catchError, combineLatest, concatMap, filter, first, forkJoin, map, of, take } from 'rxjs';
import { AttributeListApiService } from '../../components/attribute-list/services/attribute-list-api.service';
import { CqlFilterHelper } from '../../filter';

@Injectable({
  providedIn: 'root',
})
export class FeatureSelectionBookmarkService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private attributeListApiService = inject(AttributeListApiService);

  private currentFilterGroupId: string | null = null;

  public clearFilter(): void {
    if (this.currentFilterGroupId) {
      this.store$.dispatch(removeFilterGroup({ filterGroupId: this.currentFilterGroupId }));
      this.currentFilterGroupId = null;
    }
  }

  public applyFilter(filterGroup: FilterGroupModel<AttributeFilterModel>): void {
    this.currentFilterGroupId = filterGroup.id;
    this.store$.select(selectViewerLoadingState).pipe(
      first(status => status === LoadingStateEnum.LOADED)
    ).subscribe(() => {
      this.store$.dispatch(addFilterGroup({ filterGroup }));
      this.getAndZoomToFeatures(filterGroup);
    });
  }

  // private getAndZoomToFeatures(filterGroup: FilterGroupModel<AttributeFilterModel>): void {
  //   // todo: implement this
  //   filterGroup.layerIds.forEach(_layerId => {
  //     // Call features API with the filter
  //     // Then zoom to the returned features using:
  //     // this.mapService.zoomToFeatures(features);
  //   });
  // }

  private getAndZoomToFeatures(filterGroup: FilterGroupModel<AttributeFilterModel>): void {
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
        const cqlFilters = CqlFilterHelper.getFilters([filterGroup]);

        const featureRequests$ = filterGroup.layerIds.map(layerId => {
          const layer = layers.find(l => l.id === layerId);
          if (!layer) {
            return of([]);
          }

          // Get the filter for this layer
          const layerFilters = cqlFilters.get(layerId);

          // Call the API to get features
          return this.attributeListApiService.getFeatures$({
            applicationId: applicationId,
            layerId: layerId,
            filter: layerFilters || undefined,
            includeGeometry: true, // Important for zooming
            page: 1,
          }).pipe(
            map(response => response.features || []),
            catchError(() => of([])),
          );
        });

        return forkJoin(featureRequests$).pipe(
          map(results => results.flat()), // Combine all features from all layers
        );
      }),
    ).subscribe(features => {
      if (features.length > 0) {
        this.mapService.zoomToFeatures(features);
      }
    });
  }
}
