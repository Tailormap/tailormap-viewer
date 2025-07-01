import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationModel, GeoServiceModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-geo-service-used-dialog',
  templateUrl: './geo-service-used-dialog.component.html',
  styleUrls: ['./geo-service-used-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GeoServiceUsedDialogComponent {
  private dialogRef = inject<MatDialogRef<GeoServiceUsedDialogComponent>>(MatDialogRef);
  public data = inject<{
    applications: ApplicationModel[];
    service: GeoServiceModel;
}>(MAT_DIALOG_DATA);


  public onConfirm() {
    this.dialogRef.close(true);
  }

}
