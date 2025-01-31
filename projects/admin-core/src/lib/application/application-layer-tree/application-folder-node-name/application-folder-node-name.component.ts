import { Component, ChangeDetectionStrategy, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'tm-admin-application-folder-node-name',
  templateUrl: './application-folder-node-name.component.html',
  styleUrls: ['./application-folder-node-name.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFolderNodeNameComponent implements OnInit {

  public nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
  ]);

  constructor(
    private dialogRef: MatDialogRef<ApplicationFolderNodeNameComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) public data: { currentName?: string },
  ) {}

  public static openDialog$(matDialog: MatDialog, currentName?: string) {
    return matDialog.open<ApplicationFolderNodeNameComponent, { currentName?: string }, string | null>(ApplicationFolderNodeNameComponent, {
      width: '400px',
      data: {
        currentName,
      },
    }).afterClosed();
  }

  public ngOnInit() {
    this.nameControl.patchValue(this.data.currentName || '', { emitEvent: false });
  }

  public onCancel() {
    this.dialogRef.close(null);
  }

  public onCreate() {
    this.dialogRef.close(this.nameControl.value);
  }

}
