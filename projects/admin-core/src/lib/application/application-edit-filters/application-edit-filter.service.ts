import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectFilterableLayersForApplication, selectLayerIdsForSelectedFilterGroup, selectSelectedApplicationName,
} from '../state/application.selectors';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { map, switchMap, combineLatest, forkJoin, take, BehaviorSubject, tap } from 'rxjs';
import { UniqueValuesAdminService } from '@tailormap-admin/admin-api';

@Injectable({ providedIn: 'root' })
export class ApplicationEditFilterService {

  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private uniqueValuesAdminService: UniqueValuesAdminService,
  ) {}

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
  public featureTypesForSelectedLayers$ = this.layers$.pipe(
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

  public getUniqueValuesForAttribute$(attribute: string) {
    return combineLatest([
      this.store$.select(selectSelectedApplicationName),
      this.layers$,
    ]).pipe(
      take(1),
      switchMap(([ applicationName, selectedLayers ]) => {
        if (!selectedLayers || selectedLayers.length === 0) {
          return [[]];
        }
        return forkJoin(
          selectedLayers.map(layer =>
            this.uniqueValuesAdminService.getUniqueValues$({
              attribute: attribute,
              layerId: layer.appLayerId,
              applicationId: `app/${applicationName}`,
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
