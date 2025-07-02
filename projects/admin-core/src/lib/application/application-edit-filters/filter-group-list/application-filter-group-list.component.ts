import { Component, ChangeDetectionStrategy, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectApplicationFilterGroupFilterTerm, selectFilterableFilterGroups, selectSelectedApplicationId,
} from '../../state/application.selectors';
import { FormControl } from '@angular/forms';
import { ExtendedFilterGroupModel } from '../../models/extended-filter-group.model';

@Component({
  selector: 'tm-admin-application-filter-group-list',
  templateUrl: './application-filter-group-list.component.html',
  styleUrls: ['./application-filter-group-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterGroupListComponent {

  public filterGroups: Signal<ExtendedFilterGroupModel[]> = this.store$.selectSignal(selectFilterableFilterGroups);

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  public filter = new FormControl('');
  public filterTerm$ = this.store$.select(selectApplicationFilterGroupFilterTerm);

  constructor(private store$: Store) { }

}
