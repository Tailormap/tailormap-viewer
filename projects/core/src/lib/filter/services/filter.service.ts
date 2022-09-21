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

  private changedFilters$: Observable<Map<number, string | null>> = this.initChangedFilters$();

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getChangedFilters$(): Observable<Map<number, string | null>> {
    return this.changedFilters$;
  }

  public getFilterForLayer(layerId: number): string | null {
    return this.currentFilters.get(layerId) || null;
  }

  private initChangedFilters$(): Observable<Map<number, string | null>> {
    return this.store$.select(selectCQLFilters)
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
          console.log('newFilters', newFilters);
          console.log('removedFilters', removedFilters);
          console.log('changedFilters', changedFilters);
          return [
            filters,
            new Map<number, string | null>([ ...newFilters, ...removedFilters, ...changedFilters ]),
          ];
        }),
        tap(([filters]) => this.currentFilters = filters),
        map(([ , changedFilters ]) => changedFilters),
        filter((filters) => filters.size > 0),
      );
  }

}
