import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';
import { selectActiveFilterGroups } from '../../../filter/state/filter.selectors';
import { map, Observable } from 'rxjs';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';

@Component({
  selector: 'tm-filter-menu-button',
  templateUrl: './filter-menu-button.component.html',
  styleUrls: ['./filter-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.FILTER;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.filter.filtering:Filtering`));
  public activeFilters$: Observable<number | null> = this.store$.select(selectActiveFilterGroups)
    .pipe(
      map(groups => {
        const filtersPerActiveGroup: number[] = groups
          .filter(group => !group.disabled)
          .map(group => group.filters
            .filter(filter => !(FilterTypeHelper.isAttributeFilter(filter) && filter.generatedByFilterId)).length);
        const numberOfFilters = filtersPerActiveGroup.reduce((a, b) => a + b, 0);
        return numberOfFilters > 0 ? numberOfFilters : null;
      }),
    );
}
