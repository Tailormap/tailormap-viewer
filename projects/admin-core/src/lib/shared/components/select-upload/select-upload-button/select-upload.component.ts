import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, DestroyRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectUploadDialogComponent } from '../select-upload-dialog/select-upload-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

@Component({
  selector: 'tm-admin-select-upload',
  templateUrl: './select-upload.component.html',
  styleUrls: ['./select-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectUploadComponent {

  @Input()
  public category: string = '';

  @Input()
  public selectedFile: string | undefined;

  @Output()
  public fileSelected = new EventEmitter<string>();

  constructor(
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
  ) { }

  public selectFile() {
    SelectUploadDialogComponent
      .open(this.dialog, { category: this.category, uploadId: this.selectedFile })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef), take(1))
      .subscribe(selectResult => {
        if (selectResult?.cancelled || !selectResult?.uploadId) {
          return;
        }
        this.fileSelected.emit(selectResult.uploadId);
      });
  }

}
