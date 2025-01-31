import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceCreateModel } from '../models/geo-service-update.model';
import { GeoServiceModel, GeoServiceWithLayersModel, LayerSettingsModel } from '@tailormap-admin/admin-api';

export interface GeoServiceFormDialogData {
  geoService: GeoServiceModel | null;
  parentNode: string;
}

@Component({
  selector: 'tm-admin-geo-service-form-dialog',
  templateUrl: './geo-service-form-dialog.component.html',
  styleUrls: ['./geo-service-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GeoServiceFormDialogComponent {

  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public geoService: GeoServiceCreateModel | null = null;
  public updatedDefaultLayerSettings: LayerSettingsModel | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GeoServiceFormDialogData,
    private dialogRef: MatDialogRef<GeoServiceFormDialogComponent, GeoServiceWithLayersModel | null>,
    private geoServiceService: GeoServiceService,
  ) { }

  public static open(
    dialog: MatDialog,
    data: GeoServiceFormDialogData,
  ): MatDialogRef<GeoServiceFormDialogComponent, GeoServiceWithLayersModel | null> {
    return dialog.open(GeoServiceFormDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save() {
    if (!this.data.geoService) {
      this.createGeoService();
      return;
    }
    if (!this.geoService && !this.updatedDefaultLayerSettings) {
      return;
    }
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
        this.data.geoService.id,
        () => this.geoService || {},
        serviceSetting => ({ ...this.geoService?.settings, defaultLayerSettings: { ...serviceSetting.defaultLayerSettings, ...(this.updatedDefaultLayerSettings || {}) } }),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        if (result) {
          this.dialogRef.close(result);
        }
      });
  }

  private createGeoService() {
    if (!this.geoService) {
      return;
    }
    this.savingSubject.next(true);
    this.geoServiceService.createGeoService$(this.geoService, this.data.parentNode)
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        if (result) {
          this.dialogRef.close(result);
        }
      });
  }

  public updateGeoService($event: GeoServiceCreateModel | null) {
    this.geoService = $event;
  }

  public updateDefaultLayerSettings($event: LayerSettingsModel | null) {
    this.updatedDefaultLayerSettings = $event;
  }

}
