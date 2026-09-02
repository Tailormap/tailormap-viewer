import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { UploadInUseItem } from '../models/upload-remove-service.model';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'tm-admin-upload-in-use-dialog',
    templateUrl: './upload-in-use-dialog.component.html',
    styleUrls: ['./upload-in-use-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        RouterLink,
        MatDialogActions,
        MatButton,
    ],
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
