import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterGroups } from '../state/application.selectors';
import { BehaviorSubject, Observable } from 'rxjs';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { updateApplicationFiltersConfig } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit-filters',
  templateUrl: './application-edit-filters.component.html',
  styleUrls: ['./application-edit-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFiltersComponent {

  public filterGroups$: Observable<FilterGroupModel<AttributeFilterModel>[]> = new BehaviorSubject<FilterGroupModel<AttributeFilterModel>[]>([]);

  constructor(private store$: Store) {
    this.filterGroups$ = this.store$.select(selectFilterGroups);
  }

  public onFilterGroupsSaveManual(jsonString: string) {
    try {
      const filterGroups = JSON.parse(jsonString) as FilterGroupModel<AttributeFilterModel>[];
      this.store$.dispatch(updateApplicationFiltersConfig({ filterGroups }));
    } catch (e) {
      console.error('Invalid JSON string', e);
    }
  }
}
