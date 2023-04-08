import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'tm-admin-create-sub-folder',
  templateUrl: './create-sub-folder.component.html',
  styleUrls: ['./create-sub-folder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSubFolderComponent {

  public nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
  ]);

  constructor(
    private dialogRef: MatDialogRef<CreateSubFolderComponent, string | null>,
  ) { }

  public static openDialog$(matDialog: MatDialog) {
    return matDialog.open<CreateSubFolderComponent, null, string | null>(CreateSubFolderComponent, {
      width: '400px',
    }).afterClosed();
  }

  public onCancel() {
    this.dialogRef.close(null);
  }

  public onCreate() {
    this.dialogRef.close(this.nameControl.value);
  }

}
