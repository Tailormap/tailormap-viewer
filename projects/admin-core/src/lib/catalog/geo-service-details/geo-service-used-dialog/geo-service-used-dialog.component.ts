import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationModel, GeoServiceModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-geo-service-used-dialog',
  templateUrl: './geo-service-used-dialog.component.html',
  styleUrls: ['./geo-service-used-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceUsedDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<GeoServiceUsedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { applications: ApplicationModel[]; service: GeoServiceModel },
  ) { }

  public onConfirm() {
    this.dialogRef.close(true);
  }

}
