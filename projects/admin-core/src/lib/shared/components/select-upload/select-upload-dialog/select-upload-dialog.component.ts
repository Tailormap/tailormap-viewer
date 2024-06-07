import { Component, OnInit, ChangeDetectionStrategy, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, of, take } from 'rxjs';

export interface SelectUploadData {
  uploadId?: string;
  category: string;
}

export interface SelectUploadResult {
  uploadId?: string;
  cancelled: boolean;
}

@Component({
  selector: 'tm-admin-select-upload-dialog',
  templateUrl: './select-upload-dialog.component.html',
  styleUrls: ['./select-upload-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectUploadDialogComponent implements OnInit {

  public existingUploads$ = new BehaviorSubject<UploadModel[] | null>(null);
  public loading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<SelectUploadDialogComponent, SelectUploadResult>,
    @Inject(MAT_DIALOG_DATA) public data: SelectUploadData,
    private adminApiService: TailormapAdminApiV1Service,
  ) {
  }

  public static open(dialog: MatDialog, data: SelectUploadData): MatDialogRef<SelectUploadDialogComponent, SelectUploadResult> {
    return dialog.open(SelectUploadDialogComponent, { data });
  }

  public ngOnInit(): void {
    this.loading.set(true);
    this.adminApiService.getUploads$(this.data.category)
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(uploads => {
        this.existingUploads$.next(uploads);
        this.loading.set(false);
      });
  }

  public dismiss(): void {
    this.dialogRef.close({ cancelled: true });
  }

  public selectFile(upload: UploadModel) {
    this.dialogRef.close({ cancelled: false, uploadId: upload.id });
  }

  public imageSelected($event: { image: string; fileName: string }) {
    this.loading.set(true);
    const { image, mimeType } = this.prepareBase64($event.image);
    this.adminApiService.createUpload$({
      content: image,
      filename: $event.fileName,
      category: this.data.category,
      mimeType,
    })
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(upload => {
        this.loading.set(false);
        if (upload) {
          this.dialogRef.close({ cancelled: false, uploadId: upload.id });
        }
      });
  }

  public getImg(upload: UploadModel) {
    if (!upload.content) {
      return null;
    }
    const dataIdx = upload.content.indexOf('data:');
    if (upload.mimeType || dataIdx !== 0) {
      return 'data:' + upload.mimeType + ';base64,' + upload.content;
    }
    return upload.content;
  }

  private prepareBase64(image: string) {
    const dataIdx = image.indexOf('data:');
    const base64Idx = image.indexOf(';base64,');
    let mimeType: string | undefined = undefined;
    if (dataIdx === 0 && base64Idx !== -1) {
      mimeType = image.substring(dataIdx + 5, base64Idx);
      image = image.substring(base64Idx + 8);
    }
    return { image, mimeType };
  }

}
