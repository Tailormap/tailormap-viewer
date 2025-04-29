import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectFilterGroups } from '../../state/application.selectors';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-application-edit-filter',
  templateUrl: './application-edit-filter.component.html',
  styleUrls: ['./application-edit-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterComponent {

  public filter$: Observable<AttributeFilterModel | null>;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {
    this.filter$ = this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params['filterId']),
      switchMap(filterId => this.store$.select(selectFilterGroups).pipe(
        map(filterGroups => {
          for (const filterGroup of filterGroups) {
            const filter = filterGroup.filters.find(filterInGroup => filterInGroup.id === filterId);
            if (filter) {
              return filter;
            }
          }
          return null;
        }),
      )),
    );
  }

}
