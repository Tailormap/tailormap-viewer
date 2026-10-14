import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { UploadInUseItem } from '../models/upload-remove-service.model';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'tm-admin-upload-in-use-dialog',
    templateUrl: './upload-in-use-dialog.component.html',
    styleUrls: ['./upload-in-use-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        RouterLink,
        MatDialogActions,
        MatButton,
    ],
})
export class UploadInUseDialogComponent {
  public data = inject<{
    showFileName?: boolean;
    items: UploadInUseItem[];
  }>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<UploadInUseDialogComponent>>(MatDialogRef);

  public multipleUploads() {
    const allUploads = this.data.items
      .map((item: UploadInUseItem) => item.upload?.id)
      .filter(upload => !!upload);
    if (allUploads.length > 0) {
      return !allUploads.every( v => v === allUploads[0]);
    } else {
      return false;
    }
  }

  public onConfirm() {
    this.dialogRef.close(true);
  }

}
