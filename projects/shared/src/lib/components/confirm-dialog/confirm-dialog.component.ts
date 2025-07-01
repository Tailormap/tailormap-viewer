import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
  standalone: false,
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
