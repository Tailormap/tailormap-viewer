import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, DestroyRef, ViewContainerRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectUploadDialogComponent } from '../select-upload-dialog/select-upload-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { UploadCategoryEnum } from '@tailormap-admin/admin-api';
import { UploadHelper } from '@tailormap-admin/admin-api';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'tm-admin-select-upload',
    templateUrl: './select-upload.component.html',
    styleUrls: ['./select-upload.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton],
})
export class SelectUploadComponent {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private viewContainerRef = inject(ViewContainerRef);


  @Input()
  public category: UploadCategoryEnum | string = '';

  @Input()
  public selectedFile: string | null = null;

  @Input()
  public showDescriptionField: boolean = true;

  @Output()
  public fileSelected = new EventEmitter<string | null>();

  public selectFile() {
    SelectUploadDialogComponent.open(
      this.dialog,
      { category: this.category, uploadId: this.selectedFile, showDescriptionField: this.showDescriptionField },
      this.viewContainerRef,
    )
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
