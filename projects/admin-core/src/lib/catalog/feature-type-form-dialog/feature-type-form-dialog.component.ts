import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

export interface FeatureTypeFormDialogData {
  featureType: ExtendedFeatureTypeModel;
}

@Component({
  selector: 'tm-admin-feature-type-form-dialog',
  templateUrl: './feature-type-form-dialog.component.html',
  styleUrls: ['./feature-type-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeFormDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FeatureTypeFormDialogData,
    private dialogRef: MatDialogRef<FeatureTypeFormDialogComponent, ExtendedFeatureTypeModel | null>,
  ) {}

  public static open(
    dialog: MatDialog,
    data: FeatureTypeFormDialogData,
  ): MatDialogRef<FeatureTypeFormDialogComponent, ExtendedFeatureTypeModel | null> {
    return dialog.open(FeatureTypeFormDialogComponent, {
      data,
      width: '90vw',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public saved(featureType: ExtendedFeatureTypeModel | null) {
    this.dialogRef.close(featureType);
  }

}
