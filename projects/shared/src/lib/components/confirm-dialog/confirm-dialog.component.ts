import { Component, Inject } from '@angular/core';
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

  public defaultDenyButtonLabel = $localize `:@@shared.common.no:No`;
  public defaultConfirmButtonLabel = $localize `:@@shared.common.yes:Yes`;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {
  }

  public onConfirm(): void {
    this.dialogRef.close(true);
  }

  public onDismiss(): void {
    this.dialogRef.close(false);
  }

}
