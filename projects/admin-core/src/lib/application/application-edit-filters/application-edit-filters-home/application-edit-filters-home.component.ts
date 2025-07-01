import { Component, ChangeDetectionStrategy, Signal, inject } from '@angular/core';
import { selectSelectedApplicationId } from '../../state/application.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-admin-application-edit-filters-home',
  templateUrl: './application-edit-filters-home.component.html',
  styleUrls: ['./application-edit-filters-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFiltersHomeComponent {
  private store$ = inject(Store);


  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

}
