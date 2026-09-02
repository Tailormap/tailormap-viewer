import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';
import { map, Observable, of } from 'rxjs';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { FilterSourceHelper } from '../../../filter/helpers/filter-source.helper';
import { FilterListItemComponent } from '../filter-list-item/filter-list-item.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FilterListItemComponent, AsyncPipe],
})
export class FilterListComponent implements OnInit {
  private store$ = inject(Store);

  public filters$: Observable<ExtendedFilterGroupModel[]> = of([]);

  public ngOnInit(): void {
    this.filters$ = this.store$.select(selectFilterGroupsWithLayers).pipe(
      map(groups =>
        groups.filter(group => FilterSourceHelper.isStandardFilterSource(group))),
    );
  }
}
