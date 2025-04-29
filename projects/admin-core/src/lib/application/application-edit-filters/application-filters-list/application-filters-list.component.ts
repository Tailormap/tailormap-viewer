import { Component, ChangeDetectionStrategy, Signal, computed } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { selectFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent {

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  public filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);
  public filters = computed(() => {
    const filterGroups = this.filterGroups();
    return filterGroups.reduce((acc, group) => {
      return acc.concat(group.filters);
    }, [] as AttributeFilterModel[]);
  });

  constructor(private store$: Store) {}

}
