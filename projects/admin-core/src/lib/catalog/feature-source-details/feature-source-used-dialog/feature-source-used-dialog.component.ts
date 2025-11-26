import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
  standalone: false,
})
export class FeatureSourceUsedDialogComponent {
  private dialogRef = inject<MatDialogRef<FeatureSourceUsedDialogComponent, boolean | 'layer-updated'>>(MatDialogRef);
  public data = inject<{
    layers: ExtendedGeoServiceLayerModel[];
    featureSource: FeatureSourceModel;
}>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private store$ = inject(Store);
  private adminSnackbarService = inject(AdminSnackbarService);


  private destroyed = new Subject();

  constructor() {
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
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.layer-settings-updated:Layer settings updated`);
        }
        this.dialogRef.close('layer-updated');
      });
  }
}
