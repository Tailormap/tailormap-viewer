import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterGroupsWithLayers } from '../../../filter/state/filter.selectors';
import { map, Observable, of, switchMap } from 'rxjs';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { AttributeFilterService } from '../../../services/attribute-filter.service';

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
  public filters$: Observable<ExtendedFilterGroupModel[]> = of([]);

  public ngOnInit(): void {
    this.filters$ = this.store$.select(selectFilterGroupsWithLayers).pipe(
      map(groups =>
        groups.filter(group => group.layers.some(layer => layer.visible)),
      ),
      switchMap(groups => this.attributeFilterService.addAttributeAliasesToFilters$(groups)),
    );
  }

}
