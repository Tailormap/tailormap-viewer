import { Component, ChangeDetectionStrategy, Signal, computed } from '@angular/core';
import { selectFilterableLayersForApplication, selectSelectedApplicationId } from '../../state/application.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-admin-application-edit-filters-home',
  templateUrl: './application-edit-filters-home.component.html',
  styleUrls: ['./application-edit-filters-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFiltersHomeComponent {
  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  private filterableLayers = this.store$.selectSignal(selectFilterableLayersForApplication);
  public noFilterableLayers = computed(() => {
    const layers = this.filterableLayers();
    return !layers || layers.length === 0;
  });

  constructor(private store$: Store) { }

}
