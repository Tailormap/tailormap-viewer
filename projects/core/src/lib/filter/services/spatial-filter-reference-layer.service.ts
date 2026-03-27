import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, map, Observable, Subject, take } from 'rxjs';
import { selectCQLFilters, selectSpatialFilterGroupsWithReferenceLayers } from '../../state/filter-state/filter.selectors';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { SpatialFilterGeometry, SpatialFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { updateFilterGroup } from '../../state/filter-state/filter.actions';
import { FeaturesFilterHelper } from '../helpers/features-filter.helper';
import { LoadGeometriesService } from '../../services/load-geometries.service';

@Injectable({
  providedIn: 'root',
})
export class SpatialFilterReferenceLayerService implements OnDestroy {

  public static MAX_REFERENCE_FEATURES = 250;

  private store$ = inject(Store);
  private loadFeaturesService = inject(LoadGeometriesService);

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
          const cqlFilter = FeaturesFilterHelper.getFilter(allFilters.get(referenceLayer)) || '';
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

  private loadGeometries(group: FilterGroupModel<SpatialFilterModel>, referenceLayer: string, cqlFilter: string | undefined): void {
    this.loadingGeometries.next([ ...this.loadingGeometries.value, group.id ]);
    this.loadFeaturesService.loadGeometries$(SpatialFilterReferenceLayerService.MAX_REFERENCE_FEATURES, referenceLayer, cqlFilter)
      .pipe(take(1))
      .subscribe(response => {
        const geometries: SpatialFilterGeometry[] = response.features.map(feat => {
          return {
            id: feat.__fid,
            geometry: feat.geometry,
            referenceLayerId: referenceLayer,
          };
        });
        const updatedGroup: FilterGroupModel<SpatialFilterModel> = {
          ...group,
          error: response.error ? $localize `:@@core.filter.error-loading-reference-layer-geometries:Error loading reference layer geometries` : undefined,
          filters: group.filters.map(f => {
            const userDrawnGeometries = f.geometries.filter(g => typeof g.referenceLayerId === 'undefined');
            return {
              ...f,
              baseLayerId: response.error ? undefined : f.baseLayerId,
              geometries: userDrawnGeometries.concat(geometries),
              exceededMaxFeatures: response.exceededMaxFeatures,
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
