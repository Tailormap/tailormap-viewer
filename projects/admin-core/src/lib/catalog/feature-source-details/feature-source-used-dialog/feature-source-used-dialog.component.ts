import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectGeoServiceById } from '../../state/catalog.selectors';
import { ExtendedGeoServiceLayerModel } from '../../models/extended-geo-service-layer.model';
import { of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { GeoServiceLayerFormDialogComponent } from '../../geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';
import { AdminSnackbarService } from '../../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-geo-service-used-dialog',
  templateUrl: './feature-source-used-dialog.component.html',
  styleUrls: ['./feature-source-used-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureSourceUsedDialogComponent {

  private destroyed = new Subject();

  constructor(
    private dialogRef: MatDialogRef<FeatureSourceUsedDialogComponent, boolean | 'layer-updated'>,
    @Inject(MAT_DIALOG_DATA) public data: { layers: ExtendedGeoServiceLayerModel[]; featureSource: FeatureSourceModel },
    private dialog: MatDialog,
    private store$: Store,
    private adminSnackbarService: AdminSnackbarService,
  ) {
    this.dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.destroyed.next(null);
        this.destroyed.complete();
      });
  }

  public onConfirm() {
    this.dialogRef.close(true);
  }

  public updateGeoServiceLayerSetting($event: MouseEvent, layer: ExtendedGeoServiceLayerModel) {
    $event.preventDefault();
    this.store$.select(selectGeoServiceById(layer.serviceId))
      .pipe(
        take(1),
        switchMap(geoService => {
          if (!geoService) {
            return of(null);
          }
          return GeoServiceLayerFormDialogComponent.open(this.dialog, {
            geoService,
            geoServiceLayer: layer,
          }).afterClosed();
        }),
        takeUntil(this.destroyed),
      )
      .subscribe(updatedSettings => {
        if (updatedSettings) {
          this.adminSnackbarService.showMessage($localize `Layer settings updated`);
        }
        this.dialogRef.close('layer-updated');
      });
  }
}
