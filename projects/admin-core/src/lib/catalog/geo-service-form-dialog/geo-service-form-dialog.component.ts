import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceUpdateModel } from '../models/geo-service-update.model';

export interface GeoServiceFormDialogData {
  geoService: ExtendedGeoServiceModel | null;
  parentNode: string;
}

@Component({
  selector: 'tm-admin-geo-service-form-dialog',
  templateUrl: './geo-service-form-dialog.component.html',
  styleUrls: ['./geo-service-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceFormDialogComponent {

  public geoService: GeoServiceUpdateModel | null = null;
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GeoServiceFormDialogData,
    private dialogRef: MatDialogRef<GeoServiceFormDialogComponent>,
    private geoServiceService: GeoServiceService,
  ) { }

  public static open(
    dialog: MatDialog,
    data: GeoServiceFormDialogData,
  ): MatDialogRef<GeoServiceFormDialogComponent> {
    return dialog.open(GeoServiceFormDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save() {
    if (!this.geoService) {
      return;
    }
    this.savingSubject.next(true);
    const saveObservable$ = (this.data.geoService === null
        ? this.geoServiceService.createGeoService$(this.geoService, this.data.parentNode)
        : this.geoServiceService.updateGeoService$({ ...this.geoService, id: this.data.geoService.id }, this.data.parentNode)
    );
    saveObservable$
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.savingSubject.next(false));
    this.dialogRef.close(this.geoService);
  }

  public updateGeoService($event: GeoServiceUpdateModel) {
    this.geoService = $event;
  }
}
