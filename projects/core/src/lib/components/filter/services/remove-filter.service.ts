import { inject, Injectable } from '@angular/core';
import { removeFilterGroup } from '../../../filter/state/filter.actions';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { Observable, pipe, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RemoveFilterService {

  private confirmService = inject(ConfirmDialogService);
  private store$ = inject(Store);

  public removeFilter$(groupId: string): Observable<boolean> {
    return this.confirmService.confirm$(
      $localize `Remove filter?`,
      $localize `Are you sure you want to remove this filter?`,
      true,
    )
      .pipe(
        pipe(take(1)),
        tap(confirmed => {
          if (confirmed) {
            this.store$.dispatch(removeFilterGroup({ filterGroupId: groupId }));
          }
        }),
      );
  }

}
