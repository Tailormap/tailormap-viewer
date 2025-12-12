import { DestroyRef, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCQLFilters } from '../../state/filter-state/filter.selectors';
import { filter, tap } from 'rxjs/operators';
import { map, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class FilterService {

  private destroyRef = inject(DestroyRef);
  private store$ = inject(Store);
  private currentFilters: Map<string, string | null> = new Map();

  private changedFiltersSubject$ = new Subject<Map<string, string | null>>();

  public constructor() {
    this.initChangedFilters$();
  }

  public getChangedFilters$(): Observable<Map<string, string | null>> {
    return this.changedFiltersSubject$.asObservable();
  }

  public getFilterForLayer(layerId: string): string | undefined {
    return this.currentFilters.get(layerId) || undefined;
  }

  private initChangedFilters$() {
    this.store$.select(selectCQLFilters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((filters) => {
          const newFilters: Array<[ string, string ]> = Array.from(filters.keys())
            .filter((key) => !this.currentFilters.has(key))
            .map((key) => [ key, filters.get(key) || '' ]);
          const removedFilters: Array<[ string, null ]> = Array.from(this.currentFilters.keys())
            .filter((key) => !filters.has(key))
            .map((key) => [ key, null ]);
          const changedFilters: Array<[ string, string ]> = Array.from(filters.keys())
            .filter((key) => this.currentFilters.get(key) !== filters.get(key))
            .map((key) => [ key, filters.get(key) || '' ]);
          return [
            filters,
            new Map<string, string | null>([ ...newFilters, ...removedFilters, ...changedFilters ]),
          ];
        }),
        tap(([filters]) => this.currentFilters = filters),
        map(([ , changedFilters ]) => changedFilters),
        filter((filters) => filters.size > 0),
      )
      .subscribe((filters) => this.changedFiltersSubject$.next(filters));
  }

}
