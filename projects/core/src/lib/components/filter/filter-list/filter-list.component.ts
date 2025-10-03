import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterGroupsWithLayers } from '../../../filter/state/filter.selectors';
import { filter, map, Observable, of, switchMap, take } from 'rxjs';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { AttributeFilterService } from '../../../services/attribute-filter.service';
import { resetAttributeFilters } from '../../../filter/state/filter.actions';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterListComponent implements OnInit {
  private store$ = inject(Store);
  private attributeFilterService = inject(AttributeFilterService);
  private confirmService = inject(ConfirmDialogService);

  public filters$: Observable<ExtendedFilterGroupModel[]> = of([]);

  public ngOnInit(): void {
    this.filters$ = this.store$.select(selectFilterGroupsWithLayers).pipe(
      map(groups =>
        groups.filter(group => group.layers.some(layer => layer.visible)),
      ),
      switchMap(groups => this.attributeFilterService.addAttributeAliasesToFilters$(groups)),
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
