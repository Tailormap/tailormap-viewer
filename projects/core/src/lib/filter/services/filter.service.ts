import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCQLFilters } from '../state/filter.selectors';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { map, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService implements OnDestroy {

  private destroyed = new Subject();
  private store$ = inject(Store);
  private currentFilters: Map<number, string | null> = new Map();

  private changedFiltersSubject$ = new Subject<Map<number, string | null>>();

  public constructor() {
    this.initChangedFilters$();
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getChangedFilters$(): Observable<Map<number, string | null>> {
    return this.changedFiltersSubject$.asObservable();
  }

  public getFilterForLayer(layerId: number): string | undefined {
    return this.currentFilters.get(layerId) || undefined;
  }

  private initChangedFilters$() {
    this.store$.select(selectCQLFilters)
      .pipe(
        takeUntil(this.destroyed),
        map((filters) => {
          const newFilters: Array<[ number, string ]> = Array.from(filters.keys())
            .filter((key) => !this.currentFilters.has(key))
            .map((key) => [ key, filters.get(key) || '' ]);
          const removedFilters: Array<[ number, null ]> = Array.from(this.currentFilters.keys())
            .filter((key) => !filters.has(key))
            .map((key) => [ key, null ]);
          const changedFilters: Array<[ number, string ]> = Array.from(filters.keys())
            .filter((key) => this.currentFilters.get(key) !== filters.get(key))
            .map((key) => [ key, filters.get(key) || '' ]);
          return [
            filters,
            new Map<number, string | null>([ ...newFilters, ...removedFilters, ...changedFilters ]),
          ];
        }),
        tap(([filters]) => this.currentFilters = filters),
        map(([ , changedFilters ]) => changedFilters),
        filter((filters) => filters.size > 0),
      )
      .subscribe((filters) => this.changedFiltersSubject$.next(filters));
  }

}
