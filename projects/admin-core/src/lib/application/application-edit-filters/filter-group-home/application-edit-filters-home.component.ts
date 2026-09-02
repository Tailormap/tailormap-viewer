import { Component, ChangeDetectionStrategy, Signal, computed, inject } from '@angular/core';
import { selectNoFilterableLayersForSelectedApplication, selectSelectedApplicationId } from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { TooltipDirective } from '../../../../../../shared/src/lib/directives/tooltip.directive';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-application-edit-filters-home',
    templateUrl: './application-edit-filters-home.component.html',
    styleUrls: ['./application-edit-filters-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        MatButton,
        RouterLink,
        MatIcon,
    ],
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
