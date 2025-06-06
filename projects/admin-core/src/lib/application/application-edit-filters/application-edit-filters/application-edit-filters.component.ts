import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectCatalogLoadStatus } from '../../../catalog/state/catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadCatalog } from '../../../catalog/state/catalog.actions';

@Component({
  selector: 'tm-admin-application-edit-filters',
  templateUrl: './application-edit-filters.component.html',
  styleUrls: ['./application-edit-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFiltersComponent {

  constructor(
    private store$: Store,
  ) {
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

}
