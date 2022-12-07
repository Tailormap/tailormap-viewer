import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, Subject, switchMap, take } from 'rxjs';
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
  private geometriesLoaded: Map<string, string | undefined> = new Map();

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
          const currentFilter = this.geometriesLoaded.get(group.id);
          const referenceLayer = group.filters[0].baseLayerId;
          if (!referenceLayer) {
            return;
          }
          const cqlFilter = allFilters.get(referenceLayer);
          if (currentFilter !== cqlFilter) {
            this.geometriesLoaded.set(group.id, cqlFilter);
            this.loadGeometries(group, referenceLayer, cqlFilter);
          }
        });
      });
  }

  private loadGeometries(group: FilterGroupModel<SpatialFilterModel>, referenceLayer: number, cqlFilter: string | undefined): void {
    this.store$.select(selectApplicationId)
      .pipe(
        take(1),
        filter(TypesHelper.isDefined),
        switchMap(applicationId => {
          return this.api.getFeatures$({
            layerId: referenceLayer,
            applicationId,
            page: 1,
            filter: cqlFilter,
            simplify: false,
            onlyGeometries: true,
          });
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
          };
        }).filter(TypesHelper.isDefined);
        const updatedGroup = {
          ...group,
          filters: group.filters.map(f => ({ ...f, geometries })),
        };
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
