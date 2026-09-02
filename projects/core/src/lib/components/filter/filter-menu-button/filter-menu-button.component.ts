import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';
import { selectActiveFilterGroups } from '../../../state/filter-state/filter.selectors';
import { map, Observable } from 'rxjs';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { FilterSourceHelper } from '../../../filter/helpers/filter-source.helper';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-filter-menu-button',
    templateUrl: './filter-menu-button.component.html',
    styleUrls: ['./filter-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class FilterMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.FILTER;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.filter.filtering:Filtering`));
  public activeFilters$: Observable<number | null> = this.store$.select(selectActiveFilterGroups)
    .pipe(
      map(groups => {
        const filtersPerActiveGroup: number[] = groups
          .filter(group => !group.disabled && FilterSourceHelper.isStandardFilterSource(group))
          .map(group => group.filters
            .filter(filter => !(FilterTypeHelper.isAttributeFilter(filter) && filter.generatedByFilterId)).length);
        const numberOfFilters = filtersPerActiveGroup.reduce((a, b) => a + b, 0);
        return numberOfFilters > 0 ? numberOfFilters : null;
      }),
    );
}
