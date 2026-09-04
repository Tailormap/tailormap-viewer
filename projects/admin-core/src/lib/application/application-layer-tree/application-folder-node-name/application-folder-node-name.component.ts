import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { AutoFocusDirective } from '@tailormap-viewer/shared';

@Component({
    selector: 'tm-admin-application-folder-node-name',
    templateUrl: './application-folder-node-name.component.html',
    styleUrls: ['./application-folder-node-name.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CdkScrollable,
        MatDialogContent,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        AutoFocusDirective,
        MatDialogActions,
        MatButton,
    ],
})
export class ApplicationFolderNodeNameComponent implements OnInit {
  public data = inject<{
    currentName?: string;
  }>(MAT_DIALOG_DATA);
  public nameControl = new FormControl('', [ Validators.required, Validators.minLength(1) ]);
  private dialogRef = inject<MatDialogRef<ApplicationFolderNodeNameComponent, string | null>>(MatDialogRef);

  public static openDialog$(matDialog: MatDialog, currentName?: string) {
    return matDialog.open<ApplicationFolderNodeNameComponent, { currentName?: string }, string | null>(ApplicationFolderNodeNameComponent, {
      width: '400px', data: {
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
