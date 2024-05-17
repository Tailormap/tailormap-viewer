import { Injectable } from '@angular/core';
import { concatMap, of, take, tap } from 'rxjs';
import { FeatureTypeFormDialogComponent } from '../feature-type-form-dialog/feature-type-form-dialog.component';
import { FeatureSourceService } from './feature-source.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class FeatureTypeUpdateService {

  constructor(
    private featureSourceService: FeatureSourceService,
    private adminSnackbarService: AdminSnackbarService,
    private dialog: MatDialog,
  ) {
  }

  public updateFeatureTypeSetting$(featureTypeId: string, featureSourceId: number) {
    if (!featureTypeId) {
      return of(null);
    }
    return this.featureSourceService.getDraftFeatureType$(featureTypeId, `${featureSourceId}`)
      .pipe(
        take(1),
        concatMap(draftFeatureType => {
          if (!draftFeatureType) {
            return of(null);
          }
          return FeatureTypeFormDialogComponent.open(this.dialog, { featureType: draftFeatureType }).afterClosed();
        }),
        tap(updatedFeatureType => {
          if (updatedFeatureType) {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.feature-type-settings-updated:Feature type settings updated`);
          }
        }),
      );
  }

}
