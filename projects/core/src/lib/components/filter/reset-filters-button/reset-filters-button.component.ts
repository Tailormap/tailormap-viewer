import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { filter, map, Observable, of, take } from 'rxjs';
import { resetAttributeFilters } from '../../../state/filter-state/filter.actions';
import { Store } from '@ngrx/store';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';

@Component({
  selector: 'tm-reset-filters-button',
  templateUrl: './reset-filters-button.component.html',
  styleUrls: ['./reset-filters-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResetFiltersButtonComponent implements OnInit {
  private store$ = inject(Store);
  private confirmService = inject(ConfirmDialogService);

  public filters$: Observable<ExtendedFilterGroupModel[]> = of([]);

  public ngOnInit(): void {
    this.filters$ = this.store$.select(selectFilterGroupsWithLayers).pipe(
      map(groups =>
        groups.filter(group => group.layers.some(layer => layer.visible)),
      ),
    );
  }

  public resetFilters() {
    this.filters$.pipe(
      take(1),
      map(filterGroups => filterGroups.filter(group => group.source !== "PRESET")),
    ).subscribe(userAddedGroups => {
      if (userAddedGroups.length === 0) {
        this.store$.dispatch(resetAttributeFilters());
      } else {
        this.confirmService.confirm$(
          $localize `:@@core.filter.reset-filters:Reset filters`,
          $localize `:@@core.filter.reset-filters-confirm:Resetting filters will remove all your added filters. Do you want to proceed?`,
          true,
          $localize `:@@core.filter.reset-filters:Reset filters`,
          $localize `:@@core.common.cancel:Cancel`,
        ).pipe(
          filter(confirmed => confirmed),
        ).subscribe(() => {
          this.store$.dispatch(resetAttributeFilters());
        });
      }
    });

  }

}
