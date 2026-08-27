import { DestroyRef, Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectFilterableLayersForApplication, selectLayerIdsForSelectedFilterGroup, selectSelectedApplicationId,
} from '../state/application.selectors';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { map, switchMap, combineLatest, forkJoin, take, BehaviorSubject, tap, Observable, distinctUntilChanged, of } from 'rxjs';
import { FeatureTypeModel, AttributeValuesSummaryAdminService } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttributeStatisticsResponseModel } from '@tailormap-viewer/api';

@Injectable({ providedIn: 'root' })
export class ApplicationEditFilterService {
  private store$ = inject(Store);
  private featureSourceService = inject(FeatureSourceService);
  private uniqueValuesAdminService = inject(AttributeValuesSummaryAdminService);
  private destroyRef = inject(DestroyRef);


  constructor() {
    this.store$.select(selectSelectedApplicationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.uniqueValuesAdminService.clearCache();
    });
  }

  public layerIdsForSelectedGroup$ = this.store$.select(selectLayerIdsForSelectedFilterGroup);

  public layers$ = combineLatest([
    this.layerIdsForSelectedGroup$,
    this.store$.select(selectFilterableLayersForApplication),
  ]).pipe(
    map(([ layerIds, layers ]) => {
      const layerIdsSet = new Set(layerIds);
      return layers.filter(layer => layerIdsSet.has(layer.id) && !!layer.geoServiceLayer?.layerSettings?.featureType);
    }),
  );

  private isLoadingFeaturesTypes = new BehaviorSubject(false);
  public isLoadingFeaturesTypes$ = this.isLoadingFeaturesTypes.asObservable();
  public featureTypesForSelectedLayers$: Observable<FeatureTypeModel[]> = this.layers$.pipe(
    tap(() => this.isLoadingFeaturesTypes.next(true)),
    switchMap(layers => {
      if (layers.length === 0) {
        this.isLoadingFeaturesTypes.next(false);
        return [[]];
      }
      const featureTypeRequests$ = layers
        .map(layer => layer.geoServiceLayer?.layerSettings?.featureType)
        .filter((featureType) => !!featureType)
        .map(ft => this.featureSourceService.loadFeatureType$(
          ft.featureTypeName,
          `${ft.featureSourceId}`,
        ).pipe(take(1)));
      return forkJoin(featureTypeRequests$)
        .pipe(map(featureTypes => featureTypes.filter(ft => !!ft)));
    }),
    tap(() => this.isLoadingFeaturesTypes.next(false)),
  );

  public getUniqueValuesForAttribute$(attribute: string):  Observable<(string | number | boolean)[][]> {
    return this.featureTypesForSelectedLayers$.pipe(
      take(1),
      switchMap(featureTypes => {
        if (!featureTypes || featureTypes.length === 0) {
          return [];
        }
        return forkJoin(
          featureTypes.map(featureType =>
            this.uniqueValuesAdminService.getUniqueValues$({
              featureTypeId: featureType.id,
              attribute: attribute,
              filter: '',
            }).pipe(
              take(1),
              map(response => response.values || []),
            ),
          ),
        );
      }),
    );
  }

  public getAttributeSummaryValues$(attribute: string): Observable<AttributeStatisticsResponseModel> {
    return this.featureTypesForSelectedLayers$.pipe(
      take(1),
      switchMap(featureTypes => {
        if (!featureTypes || featureTypes.length === 0) {
          return of({ hasError: true, filterApplied: false, min: null, max: null, count: 0, sum: 0, avg: 0 });
        }

        return this.uniqueValuesAdminService.getAttributeStatistics$({
          featureTypeId: featureTypes[0].id, attribute: attribute, filter: '',
        }).pipe(take(1));
      }),
    );
  }
}
