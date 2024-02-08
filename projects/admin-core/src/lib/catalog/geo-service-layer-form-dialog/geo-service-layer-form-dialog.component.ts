import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { BehaviorSubject, Observable, of, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceCreateModel } from '../models/geo-service-update.model';
import { GeoServiceWithLayersModel, LayerSettingsModel } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { selectGeoServiceLayerSettingsByLayerId } from '../state/catalog.selectors';
import { Store } from '@ngrx/store';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';

export interface GeoServiceLayerFormDialogData {
  geoService: ExtendedGeoServiceModel;
  geoServiceLayer: ExtendedGeoServiceLayerModel;
}

@Component({
  selector: 'tm-admin-geo-service-layer-form-dialog',
  templateUrl: './geo-service-layer-form-dialog.component.html',
  styleUrls: ['./geo-service-layer-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceLayerFormDialogComponent {

  public geoServiceLayerSettings$: Observable<GeoServiceLayerSettingsModel | null> = of(null);

  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public geoService: GeoServiceCreateModel | null = null;
  public updatedLayerSettings: LayerSettingsModel | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GeoServiceLayerFormDialogData,
    private dialogRef: MatDialogRef<GeoServiceLayerFormDialogComponent, GeoServiceWithLayersModel | null>,
    private store$: Store,
    private geoServiceService: GeoServiceService,
  ) {
    this.geoServiceLayerSettings$ = this.store$.select(selectGeoServiceLayerSettingsByLayerId(data.geoServiceLayer.id));
  }

  public static open(
    dialog: MatDialog,
    data: GeoServiceLayerFormDialogData,
  ): MatDialogRef<GeoServiceLayerFormDialogComponent, GeoServiceWithLayersModel | null> {
    return dialog.open(GeoServiceLayerFormDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save(serviceId: string, layerName: string) {
    if (!this.updatedLayerSettings) {
      return;
    }
    const updatedLayerSettings = { ...this.updatedLayerSettings };
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
      serviceId,
      () => ({}),
      serviceSetting => ({ layerSettings: { ...(serviceSetting.layerSettings || {}), [layerName]: updatedLayerSettings } }),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        if (result) {
          this.dialogRef.close(result);
        }
      });
  }

  public updateLayerSettings($event: LayerSettingsModel | null) {
    this.updatedLayerSettings = $event;
  }

}
