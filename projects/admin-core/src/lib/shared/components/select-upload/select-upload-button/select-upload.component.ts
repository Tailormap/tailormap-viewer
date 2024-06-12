import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, DestroyRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectUploadDialogComponent } from '../select-upload-dialog/select-upload-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { UploadCategoryEnum } from '../models/upload-category.enum';
import { UploadHelper } from '../helpers/upload.helper';

@Component({
  selector: 'tm-admin-select-upload',
  templateUrl: './select-upload.component.html',
  styleUrls: ['./select-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectUploadComponent {

  @Input()
  public category: UploadCategoryEnum | string = '';

  @Input()
  public selectedFile: string | null = null;

  @Output()
  public fileSelected = new EventEmitter<string | null>();

  constructor(
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
  ) {
    setTimeout(() => {
      document.querySelector<HTMLButtonElement>('tm-admin-select-upload button')?.click();
    }, 0);
  }

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

  public clear() {
    this.fileSelected.emit(null);
  }

  public getUrl(selectedFile: string) {
    return UploadHelper.getUrlForFile(selectedFile, this.category);
  }

}
