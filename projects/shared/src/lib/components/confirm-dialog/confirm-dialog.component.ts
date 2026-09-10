import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogActions } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message?: string;
  removeConfirm?: boolean;
  confirmButtonLabel?: string;
  denyButtonLabel?: string;
  hideDenyButton?: boolean;
}

@Component({
    selector: 'tm-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.css'],
    imports: [
        MatDialogTitle,
        MatDialogActions,
        MatButton,
    ],
})
export class ConfirmDialogComponent {
  public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef);
  public data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);


  public defaultDenyButtonLabel = $localize `:@@shared.common.no:No`;
  public defaultConfirmButtonLabel = $localize `:@@shared.common.yes:Yes`;

  public onConfirm(): void {
    this.dialogRef.close(true);
  }

  public onDismiss(): void {
    this.dialogRef.close(false);
  }

}
