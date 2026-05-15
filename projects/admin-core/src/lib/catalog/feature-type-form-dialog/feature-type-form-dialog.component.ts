import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';

export interface FeatureTypeFormDialogData {
  featureType: FeatureTypeModel;
}

@Component({
  selector: 'tm-admin-feature-type-form-dialog',
  templateUrl: './feature-type-form-dialog.component.html',
  styleUrls: ['./feature-type-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureTypeFormDialogComponent {
  public data = inject<FeatureTypeFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<FeatureTypeFormDialogComponent, FeatureTypeModel | null>>(MatDialogRef);

  public static open(
    dialog: MatDialog,
    data: FeatureTypeFormDialogData,
  ): MatDialogRef<FeatureTypeFormDialogComponent, FeatureTypeModel | null> {
    return dialog.open(FeatureTypeFormDialogComponent, {
      data,
      width: '90vw',
    });
  }

  public cancelled() {
    this.dialogRef.close();
  }

  public saved(featureType: FeatureTypeModel | null) {
    this.dialogRef.close(featureType);
  }

}
