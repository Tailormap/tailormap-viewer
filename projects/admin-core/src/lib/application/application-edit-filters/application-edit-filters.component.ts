import { ChangeDetectionStrategy, Component, computed, Signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectCatalogLoadStatus } from '../../catalog/state/catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadCatalog } from '../../catalog/state/catalog.actions';
import { selectNoFilterableLayersForSelectedApplication, selectSelectedApplicationId } from '../state/application.selectors';

@Component({
  selector: 'tm-admin-application-edit-filters',
  templateUrl: './application-edit-filters.component.html',
  styleUrls: ['./application-edit-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFiltersComponent {
  private store$ = inject(Store);

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public noFilterableLayers: Signal<boolean> = this.store$.selectSignal(selectNoFilterableLayersForSelectedApplication);
  public createFilterTooltip = computed(() => {
    if (this.noFilterableLayers()) {
      return $localize `:@@admin-core.application.filters.no-filterable-layers:There are no filterable layers for this application`;
    }
    return $localize `:@@admin-core.application.filters.create-filter:Create filter`;
  });

  constructor() {
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

}
