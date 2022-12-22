import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, catchError, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { selectCQLFilters, selectSpatialFilterGroupsWithReferenceLayers } from '../state/filter.selectors';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { FilterGroupModel } from '../models/filter-group.model';
import { SpatialFilterGeometry, SpatialFilterModel } from '../models/spatial-filter.model';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { selectApplicationId } from '../../state/core.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';
import { updateFilterGroup } from '../state/filter.actions';

@Injectable({
  providedIn: 'root',
})
export class SpatialFilterReferenceLayerService implements OnDestroy {

  private store$ = inject(Store);
  private api = inject<TailormapApiV1ServiceModel>(TAILORMAP_API_V1_SERVICE);

  private destroyed = new Subject();
  private geometriesLoaded: Map<string, string> = new Map();

  private loadingGeometries = new BehaviorSubject<string[]>([]);

  constructor() {
    this.store$.select(selectCQLFilters)
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged(),
        withLatestFrom(this.store$.select(selectSpatialFilterGroupsWithReferenceLayers)),
      )
      .subscribe(([ allFilters, spatialFilterGroups ]) => {
        this.cleanUpOldGeometries(spatialFilterGroups);
        spatialFilterGroups.forEach(group => {
          const currentLoadedKey = this.geometriesLoaded.get(group.id);
          const referenceLayer = group.filters[0].baseLayerId;
          if (!referenceLayer) {
            return;
          }
          const cqlFilter = allFilters.get(referenceLayer) || '';
          const loadedKey = `${referenceLayer}-${cqlFilter}`;
          if (currentLoadedKey !== loadedKey) {
            this.geometriesLoaded.set(group.id, loadedKey);
            this.loadGeometries(group, referenceLayer, cqlFilter);
          }
        });
      });
  }

  public isLoadingGeometryForGroup$(groupId: string): Observable<boolean> {
    return this.loadingGeometries.asObservable().pipe(map(groups => groups.includes(groupId)));
  }

  private loadGeometries(group: FilterGroupModel<SpatialFilterModel>, referenceLayer: number, cqlFilter: string | undefined): void {
    this.store$.select(selectApplicationId)
      .pipe(
        take(1),
        filter(TypesHelper.isDefined),
        tap(() => this.loadingGeometries.next([ ...this.loadingGeometries.value, group.id ])),
        switchMap(applicationId => {
          return this.api.getFeatures$({
            layerId: referenceLayer,
            applicationId,
            page: 1,
            filter: cqlFilter === '' ? undefined : cqlFilter,
            simplify: false,
            onlyGeometries: true,
          }).pipe(
            map(response => ({
              features: response.features,
              error: false,
            })),
            catchError(() => {
              return of(({ features: [], error: true }));
            }),
          );
        }),
      )
      .subscribe(response => {
        const geometries: SpatialFilterGeometry[] = response.features.map<SpatialFilterGeometry | undefined>(feat => {
          if (!feat.geometry) {
            return undefined;
          }
          return {
            id: feat.__fid,
            geometry: feat.geometry,
            referenceLayerId: referenceLayer,
          };
        }).filter(TypesHelper.isDefined);
        const updatedGroup: FilterGroupModel<SpatialFilterModel> = {
          ...group,
          error: response.error ? $localize `Error loading reference layer geometries` : undefined,
          filters: group.filters.map(f => {
            const userDrawnGeometries = f.geometries.filter(g => typeof g.referenceLayerId === 'undefined');
            return {
              ...f,
              baseLayerId: response.error ? undefined : f.baseLayerId,
              geometries: userDrawnGeometries.concat(geometries),
            };
          }),
        };
        this.loadingGeometries.next(this.loadingGeometries.value.filter(id => id !== group.id));
        this.store$.dispatch(updateFilterGroup({ filterGroup: updatedGroup }));
      });
  }

  private cleanUpOldGeometries(spatialFilterGroups: FilterGroupModel<SpatialFilterModel>[]): void {
    Array.from(this.geometriesLoaded.keys())
      .filter(key => spatialFilterGroups.findIndex(g => g.id === key) === -1)
      .forEach(key => this.geometriesLoaded.delete(key));
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
