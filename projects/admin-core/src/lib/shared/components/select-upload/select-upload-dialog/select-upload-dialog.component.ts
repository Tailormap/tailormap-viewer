import { Component, OnInit, ChangeDetectionStrategy, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, of, take } from 'rxjs';
import { UploadCategoryEnum } from '../models/upload-category.enum';
import { UploadHelper } from '../helpers/upload.helper';

export interface SelectUploadData {
  uploadId: string | null;
  category: UploadCategoryEnum | string;
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
  public resizeSize: number;
  public label: string;

  constructor(
    public dialogRef: MatDialogRef<SelectUploadDialogComponent, SelectUploadResult>,
    @Inject(MAT_DIALOG_DATA) public data: SelectUploadData,
    private adminApiService: TailormapAdminApiV1Service,
  ) {
    this.label = $localize `:@@admin-core.common.file:file`;
    if (this.data.category === UploadCategoryEnum.APPLICATION_LOGO) {
      this.label = $localize `:@@admin-core.common.logo:logo`;
    }
    if (this.data.category === UploadCategoryEnum.LEGEND) {
      this.label = $localize `:@@admin-core.common.legend:legend`;
    }
    this.resizeSize = this.data.category === UploadCategoryEnum.APPLICATION_LOGO
      ? 600
      : Infinity;
  }

  public static open(dialog: MatDialog, data: SelectUploadData): MatDialogRef<SelectUploadDialogComponent, SelectUploadResult> {
    return dialog.open(SelectUploadDialogComponent, { data, width: '680px' });
  }

  public ngOnInit(): void {
    this.loading.set(true);
    this.adminApiService.getUploads$(this.data.category)
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(uploads => {
        this.existingUploads$.next(uploads === null ? uploads : uploads.map<UploadModel>(upload => ({
          ...upload,
          contentSize: this.humanFileSize(upload.contentLength),
        })));
        this.loading.set(false);
      });
  }

  private humanFileSize(sizeBytes: number | bigint | null | undefined): string {
    // https://stackoverflow.com/a/72596863
    if (sizeBytes === null || typeof sizeBytes === 'undefined') {
      return '';
    }
    const UNITS = [ 'byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte' ];
    const BYTES_PER_KB = 1000;
    let size = Math.abs(Number(sizeBytes));
    let u = 0;
    while(size >= BYTES_PER_KB && u < UNITS.length-1) {
      size /= BYTES_PER_KB;
      ++u;
    }
    return new Intl.NumberFormat([], { style: 'unit', unit: UNITS[u], unitDisplay: 'short', maximumFractionDigits: 1 })
      .format(size);
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
    return UploadHelper.getUrlForFile(upload.id, upload.category, upload.filename);
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

  public removeUpload($event: MouseEvent, upload: UploadModel) {
    $event.stopPropagation();
    // check in provided service if this image is used somewhere
  }

}
