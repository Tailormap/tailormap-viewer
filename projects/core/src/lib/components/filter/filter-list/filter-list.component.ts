import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterGroupsWithLayers } from '../../../filter/state/filter.selectors';
import { Observable, of } from 'rxjs';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';

@Component({
  selector: 'tm-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterListComponent implements OnInit {

  private store$ = inject(Store);
  public filters$: Observable<ExtendedFilterGroupModel[]> = of([]);

  public ngOnInit(): void {
    this.filters$ = this.store$.select(selectFilterGroupsWithLayers);
  }

}
