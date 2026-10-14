import {
  Component, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, ViewContainerRef, inject, input, output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectUploadDialogComponent, SelectUploadTexts } from '../select-upload-dialog/select-upload-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';

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

  public category = input<UploadCategoryEnum | string>('');
  public maxImageSize = input<number | null>(null);
  public dialogTexts = input<SelectUploadTexts | undefined>(undefined);
  public selectedFile = input<string | null>(null);
  public showDescriptionField = input(true);
  public fileSelected = output<string | null>();

  public selectFile() {
    SelectUploadDialogComponent.open(
      this.dialog,
      {
        category: this.category(),
        uploadId: this.selectedFile(),
        showDescriptionField: this.showDescriptionField(),
        maxImageSize: this.maxImageSize(),
        texts: this.dialogTexts(),
      },
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

  public getSelectButtonTitle() {
    return this.dialogTexts()?.title ?? $localize`:@@admin-core.common.select-file:Select file`;
  }

  public clear() {
    this.fileSelected.emit(null);
  }

  public getUrl(selectedFile: string) {
    return UploadedFileHelper.getAdminUrlForFile(selectedFile, this.category());
  }
}
