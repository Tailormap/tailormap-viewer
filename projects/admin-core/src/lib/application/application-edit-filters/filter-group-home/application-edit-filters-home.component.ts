import { Component, ChangeDetectionStrategy, Signal, computed, inject } from '@angular/core';
import { selectNoFilterableLayersForSelectedApplication, selectSelectedApplicationId } from '../../state/application.selectors';
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
  public noFilterableLayers: Signal<boolean> = this.store$.selectSignal(selectNoFilterableLayersForSelectedApplication);
  public noFilterableLayersTooltip = computed(() => {
    if (this.noFilterableLayers()) {
      return $localize `:@@admin-core.application.filters.no-filterable-layers:There are no filterable layers for this application`;
    }
    return null;
  });

}
