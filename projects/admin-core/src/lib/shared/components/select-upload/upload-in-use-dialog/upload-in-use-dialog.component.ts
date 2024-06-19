import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UploadInUseItem } from '../models/upload-remove-service.model';

@Component({
  selector: 'tm-admin-upload-in-use-dialog',
  templateUrl: './upload-in-use-dialog.component.html',
  styleUrls: ['./upload-in-use-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadInUseDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<UploadInUseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { items: UploadInUseItem[] },
  ) { }

  public onConfirm() {
    this.dialogRef.close(true);
  }

}
