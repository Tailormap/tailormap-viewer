import { Injectable, inject, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  FilterGroupModel, AttributeFilterModel, TAILORMAP_API_V1_SERVICE, FeaturesResponseModel, FeatureModel,
} from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';
import { selectAppLayerIds, selectLayer, selectLayers, selectVisibleLayersWithAttributes } from '../../map';
import { selectViewerId } from '../../state';
import { LoadingStateEnum, SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { BehaviorSubject, catchError, combineLatest, concatMap, filter, forkJoin, map, Observable, of, take } from 'rxjs';
import { CqlFilterHelper, FeaturesFilterHelper, FeaturesFilters } from '../../filter';
import {
  emptyFeatureInfo,
  featureInfoLoaded, hideFeatureInfoDialog, openFeatureInfoWithBookmarkFeatures, setFeatureInfoLayers,
} from '../../components/feature-info/state/feature-info.actions';
import { FeatureStylingHelper } from '../../shared';
import { FeatureSelectionBookmarkHelper } from './feature-selection-bookmark.helper';
import { FeatureSelectionBookmarkData } from './application-bookmark-fragments';
import { tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookmarkService } from '../bookmark/bookmark.service';

/**
 * This service applies a feature selection bookmark fragment when starting the application and when the bookmark changes.
 * It reads the 'feature' part of the URL bookmark, fetches matching features, highlights
 * them on the map, and, in base layout, opens the feature info panel.
 *
 * Format is feature:layers=service_id/layername;attribute=attributeName;value=attributeValue.
 * The layers are identified by the service id and the layer name, separated by a '/'. Layers of incorrect format will be ignored.
 * Supports multiple layers, separated by a comma:
 * feature:layers=service_id/layername,other_service/other_layer;attribute=attributeName;value=attributeValue
 * Optionally include a filter parameter to add an attribute filter:
 * feature:layers=service_id/layername;attribute=attributeName;value=attributeValue;filter=true
 *
 * The fid can be used to select a single feature by its fid. This can be done by setting the attribute to '__fid'.
 * No filter can be created in this case, so the filter parameter will be ignored.
 *
 * The fragment can also be set by a parent window via a postMessage event, to prevent reloading when the application is in an IFrame,
 * using the format:
 * { type: 'tailormap-feature-selection', value: 'layers=service_id/layername;attribute=attributeName;value=attributeValue' }
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureSelectionBookmarkService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private api = inject(TAILORMAP_API_V1_SERVICE);
  private snackBar = inject(MatSnackBar);
  private bookmarkService = inject(BookmarkService);
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
    this.store$.dispatch(emptyFeatureInfo());
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
      ).subscribe(layerIds => {
      if (fragment.attributeName === '__fid') {
        this.applyFidSelection(layerIds, fragment.attributeValue, isEmbedded);
      } else {
        const filterOrError = FeatureSelectionBookmarkHelper.createFilterGroup(layerIds, fragment.attributeName, fragment.attributeValue);
        if (filterOrError && !('errorMessage' in filterOrError)) {
          this.applyFilter(filterOrError, fragment.createFilter || false, isEmbedded);
        } else if (filterOrError && 'errorMessage' in filterOrError) {
          this.showSnackbarMessage(filterOrError.errorMessage);
        }
      }
    });
  }

  public applyFilter(filterGroup: FilterGroupModel<AttributeFilterModel>, createFilter: boolean, isEmbedded: boolean): void {
    this.currentFilterGroupId = filterGroup.id;
    if (createFilter) {
      this.store$.dispatch(addFilterGroup({ filterGroup }));
    }
    this.applyFeatureSelection(
      filterGroup.layerIds,
      this.getFeatures$(filterGroup),
      isEmbedded,
    );
  }

  private applyFidSelection(layerIds: string[], fid: string, isEmbedded: boolean): void {
    if (!layerIds || layerIds.length === 0) {
      this.showSnackbarMessage($localize `:@@core.feature-bookmark.no-layers:No layers specified in Feature Selection Bookmark`);
      return;
    }
    this.applyFeatureSelection(
      layerIds,
      this.getFeaturesByFid$(layerIds, fid),
      isEmbedded,
    );
  }

  private applyFeatureSelection(
    layerIds: string[],
    features$: Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]>,
    isEmbedded: boolean,
  ): void {
    if (isEmbedded) {
      this.highlightFeatures(features$);
    } else {
      this.addFeaturesToFeatureInfo(layerIds, features$);
    }
  }

  private highlightFeatures(features$: Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]>): void {
    features$
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

  private addFeaturesToFeatureInfo(
    layerIds: string[],
    features$: Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]>,
  ): void {
    this.setFeatureInfoLayers(layerIds);
    features$
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
      .subscribe(responses => {
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

  private getFeatures$(filterGroup: FilterGroupModel<AttributeFilterModel>): Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]> {
    return combineLatest([
      this.store$.select(selectViewerId),
      this.store$.select(selectLayers),
    ]).pipe(
      take(1),
      concatMap(([ applicationId, layers ]) => {
        if (!applicationId || !layers) {
          return of([]);
        }
        // Get the CQL filters from the filter group for each layer
        const allFeaturesFilters: FeaturesFilters = CqlFilterHelper.getFilters([filterGroup]);

        const featureRequests$ = filterGroup.layerIds.map(layerId => {
          const layer = layers.find(l => l.id === layerId);
          if (!layer) {
            return of([]);
          }

          // Get the filter for this layer
          const layerFeaturesFilters = allFeaturesFilters.get(layerId);
          const cqlFilter: string | undefined =  layerFeaturesFilters
            ? FeaturesFilterHelper.getFilter(layerFeaturesFilters) || undefined
            : undefined;

          return this.api.getFeatures$({
            applicationId: applicationId,
            layerId: layerId,
            filter: cqlFilter,
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

  private getFeaturesByFid$(layerIds: string[], fid: string): Observable<{ layerId: string; featuresResponse: FeaturesResponseModel }[]> {
    return combineLatest([
      this.store$.select(selectViewerId),
      this.store$.select(selectLayers),
    ]).pipe(
      take(1),
      concatMap(([ applicationId, layers ]) => {
        if (!applicationId || !layers) {
          return of([]);
        }
        const featureRequests$ = layerIds.map(layerId => {
          const layer = layers.find(l => l.id === layerId);
          if (!layer) {
            return of([]);
          }
          return this.api.getFeatures$({
            applicationId,
            layerId,
            __fid: fid,
            geometryInAttributes: true,
          }).pipe(
            map(featuresResponse => ({ layerId, featuresResponse })),
            catchError(() => of([])),
          );
        });
        return forkJoin(featureRequests$).pipe(
          map(results => results.flat()),
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

  public getFidSelectionUrl$(appLayerId: string, fid: string): Observable<string | null> {
    return combineLatest([
      this.store$.select(selectLayer(appLayerId)),
      this.bookmarkService.getBookmarkValue$(),
    ]).pipe(
      take(1),
      map(([ layer, bookmark ]) => {
        if (!layer || !fid) {
          return null;
        }
        const fragment = FeatureSelectionBookmarkHelper.createFidSelectionFragment(layer.serviceId, layer.layerName, fid);
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        return `${baseUrl}#${bookmark + fragment}`;
      }),
    );
  }
}
