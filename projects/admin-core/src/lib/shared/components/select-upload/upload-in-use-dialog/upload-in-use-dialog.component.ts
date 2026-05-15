import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UploadInUseItem } from '../models/upload-remove-service.model';

@Component({
  selector: 'tm-admin-upload-in-use-dialog',
  templateUrl: './upload-in-use-dialog.component.html',
  styleUrls: ['./upload-in-use-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadInUseDialogComponent {
  public data = inject<{
    items: UploadInUseItem[];
  }>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<UploadInUseDialogComponent>>(MatDialogRef);

  public onConfirm() {
    this.dialogRef.close(true);
  }

}
