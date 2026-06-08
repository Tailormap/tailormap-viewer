import { Injectable, inject, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  FilterGroupModel, AttributeFilterModel, TAILORMAP_API_V1_SERVICE, FeaturesResponseModel, FeatureModel,
} from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';
import { selectAppLayerIds, selectLayers, selectVisibleLayersWithAttributes } from '../../map';
import { selectViewerId } from '../../state';
import { LoadingStateEnum, SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { BehaviorSubject, catchError, combineLatest, concatMap, filter, forkJoin, map, Observable, of, take } from 'rxjs';
import { CqlFilterHelper, FeaturesFilterHelper } from '../../filter';
import {
  featureInfoLoaded, hideFeatureInfoDialog, openFeatureInfoWithBookmarkFeatures, setFeatureInfoLayers,
} from '../../components/feature-info/state/feature-info.actions';
import { FeatureStylingHelper } from '../../shared';
import { FeatureSelectionBookmarkHelper } from './feature-selection-bookmark.helper';
import { FeatureSelectionBookmarkData } from './application-bookmark-fragments';
import { tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class FeatureSelectionBookmarkService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private api = inject(TAILORMAP_API_V1_SERVICE);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  private currentFilterGroupId: string | null = null;
  private selectedFeatures: BehaviorSubject<FeatureModel[]> = new BehaviorSubject<FeatureModel[]>([]);
  private selectedFeatures$ = this.selectedFeatures.asObservable();

  private static FEATURE_SELECTION_BOOKMARK_LAYER_NAME = 'feature-selection-bookmark-layer';

  constructor() {
    this.mapService.renderFeatures$(
      FeatureSelectionBookmarkService.FEATURE_SELECTION_BOOKMARK_LAYER_NAME,
      this.selectedFeatures$,
      FeatureStylingHelper.getDefaultHighlightStyle('attribute-list-highlight-style'),
      { zoomToFeature: true },
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  public clearSelection(): void {
    this.store$.dispatch(hideFeatureInfoDialog());
    if (this.currentFilterGroupId) {
      this.store$.dispatch(removeFilterGroup({ filterGroupId: this.currentFilterGroupId }));
      this.currentFilterGroupId = null;
    }
    this.selectedFeatures.next([]);
  }

  public applyBookmarkFragment(fragment: FeatureSelectionBookmarkData | null, isEmbedded: boolean) {
    if (!fragment) {
      return;
    }
    this.store$.select(selectAppLayerIds(fragment.layers))
      .pipe(
        take(1),
        map(layersIds => FeatureSelectionBookmarkHelper.createFilterGroup(layersIds, fragment.attributeName, fragment.attributeValue)),
      ).subscribe(filterOrError => {
        if (filterOrError && !('errorMessage' in filterOrError)) {
          this.applyFilter(filterOrError, fragment.createFilter || false, isEmbedded);
        } else if (filterOrError && 'errorMessage' in filterOrError) {
          this.showSnackbarMessage(filterOrError.errorMessage);
        }
      });
  }

  public applyFilter(filterGroup: FilterGroupModel<AttributeFilterModel>, createFilter: boolean, isEmbedded: boolean): void {
    this.currentFilterGroupId = filterGroup.id;
    if (createFilter) {
      this.store$.dispatch(addFilterGroup({ filterGroup }));
    }
    if (isEmbedded) {
      this.getAndHighlightFeatures(filterGroup);
    } else {
      this.getFeaturesAndAddToFeatureInfo(filterGroup);
    }
  }

  private getFeaturesAndAddToFeatureInfo(filterGroup: FilterGroupModel<AttributeFilterModel>) {
    this.setFeatureInfoLayers(filterGroup.layerIds);
    this.getFeatures$(filterGroup)
      .pipe(
        take(1),
        filter(responses => {
          if (responses.length === 0 || responses.every(r => r.featuresResponse.total === 0)) {
            this.showSnackbarMessage($localize `:@@core.feature-bookmark.no-feature-found:No feature found`);
            return false;
          }
          return true;
        }),
      )
      .subscribe((responses) => {
        const featureInfoResponses = responses
          .map(response => FeatureSelectionBookmarkHelper.featuresToFeatureInfo(response.featuresResponse, response.layerId));

        featureInfoResponses.forEach(response => {
          this.store$.dispatch(featureInfoLoaded({
            featureInfo: response,
          }));
        });
        this.mapService.zoomToFeatures(featureInfoResponses.flatMap(r => r.features));
        this.store$.dispatch(openFeatureInfoWithBookmarkFeatures());
      });
  }

  private getAndHighlightFeatures(filterGroup: FilterGroupModel<AttributeFilterModel>) {
    this.getFeatures$(filterGroup)
      .pipe(
        tap(responses => {
          if (responses.length === 0 || responses.every(r => r.featuresResponse.total === 0)) {
            this.showSnackbarMessage($localize `:@@core.feature-bookmark.no-feature-found:No feature found`);
          }
        }),
        map(responses => responses.flatMap(response => response.featuresResponse.features)),
      )
      .subscribe(features => this.selectedFeatures.next(features));
  }

  private getFeatures$(filterGroup: FilterGroupModel<AttributeFilterModel>): Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]> {
    return combineLatest([
      this.store$.select(selectViewerId),
      this.store$.select(selectLayers),
    ]).pipe(
      take(1),
      concatMap(([ applicationId, layers ]) => {
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
    );
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

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 10000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }
}
