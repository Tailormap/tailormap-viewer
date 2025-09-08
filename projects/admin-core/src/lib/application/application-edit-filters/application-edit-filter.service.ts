import { DestroyRef, Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectFilterableLayersForApplication, selectLayerIdsForSelectedFilterGroup, selectSelectedApplicationId,
} from '../state/application.selectors';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { map, switchMap, combineLatest, forkJoin, take, BehaviorSubject, tap, Observable, distinctUntilChanged } from 'rxjs';
import { FeatureTypeModel, UniqueValuesAdminService } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class ApplicationEditFilterService {
  private store$ = inject(Store);
  private featureSourceService = inject(FeatureSourceService);
  private uniqueValuesAdminService = inject(UniqueValuesAdminService);
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
      return layers.filter(layer => layerIdsSet.has(layer.appLayerId) && !!layer.geoServiceLayer.layerSettings?.featureType);
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
        .map(layer => layer.geoServiceLayer.layerSettings?.featureType)
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

}
