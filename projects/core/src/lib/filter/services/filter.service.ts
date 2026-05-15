import { DestroyRef, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCQLFilters } from '../../state/filter-state/filter.selectors';
import { filter, tap } from 'rxjs/operators';
import { map, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayerFeaturesFilters } from '../models/feature-filter.model';

@Injectable({
  providedIn: 'root',
})
export class FilterService {

  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private currentFilters: Map<string, LayerFeaturesFilters | null> = new Map();

  private changedFiltersSubject$ = new Subject<Map<string, LayerFeaturesFilters | null>>();

  public constructor() {
    this.initChangedFilters$();
  }

  public getChangedFilters$(): Observable<Map<string, LayerFeaturesFilters | null>> {
    return this.changedFiltersSubject$.asObservable();
  }

  public getFilterForLayer(layerId: string): LayerFeaturesFilters | undefined {
    return this.currentFilters.get(layerId) || undefined;
  }

  private initChangedFilters$() {
    this.store$.select(selectCQLFilters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((filters) => {
          const newFilters: Array<[ string, LayerFeaturesFilters ]> = Array.from(filters.keys())
            .filter((key) => !this.currentFilters.has(key))
            .map((key) => [ key, filters.get(key) || new Map() ]);
          const removedFilters: Array<[ string, null ]> = Array.from(this.currentFilters.keys())
            .filter((key) => !filters.has(key))
            .map((key) => [ key, null ]);
          const changedFilters: Array<[ string, LayerFeaturesFilters ]> = Array.from(filters.keys())
            .filter((key) => FilterService.hasFilterChanges(this.currentFilters.get(key), filters.get(key)))
            .map((key) => [ key, filters.get(key) || new Map() ]);
          return [
            filters,
            new Map<string, LayerFeaturesFilters | null>([ ...newFilters, ...removedFilters, ...changedFilters ]),
          ];
        }),
        tap(([filters]) => this.currentFilters = filters),
        map(([ , changedFilters ]) => changedFilters),
        filter((filters) => filters.size > 0),
      )
      .subscribe((filters) => this.changedFiltersSubject$.next(filters));
  }

  private static hasFilterChanges(
    currentFilter: LayerFeaturesFilters | null | undefined,
    newFilter: LayerFeaturesFilters | undefined,
  ): boolean {
    if (!currentFilter && !newFilter) {
      return false;
    }
    if ((currentFilter && !newFilter) || (!currentFilter && newFilter)) {
      return true;
    }
    if (currentFilter?.size !== newFilter?.size) {
      return true;
    }
    const curFilter: LayerFeaturesFilters = currentFilter || new Map();
    const newFilt: LayerFeaturesFilters = newFilter || new Map();
    for (const [ key, value ] of curFilter) {
      const newValue = newFilt.get(key);
      if (!newValue || value !== newValue) {
        return true;
      }
    }
    return false;
  }

}
