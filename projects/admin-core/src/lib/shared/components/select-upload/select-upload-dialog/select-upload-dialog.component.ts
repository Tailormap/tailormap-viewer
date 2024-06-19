import { Component, OnInit, ChangeDetectionStrategy, Inject, signal, ViewContainerRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, concatMap, map, of, take, tap } from 'rxjs';
import { UploadCategoryEnum } from '../models/upload-category.enum';
import { UploadHelper } from '../helpers/upload.helper';
import { UPLOAD_REMOVE_SERVICE } from '../models/upload-remove-service.injection-token';
import { UploadRemoveServiceModel } from '../models/upload-remove-service.model';
import { UploadInUseDialogComponent } from '../upload-in-use-dialog/upload-in-use-dialog.component';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../services/admin-snackbar.service';

export interface SelectUploadData {
  uploadId: string | null;
  category: UploadCategoryEnum | string;
}

export interface SelectUploadResult {
  uploadId?: string;
  cancelled: boolean;
}

interface DialogProps {
  maxImageSize: number;
  title: string;
  selectExistingTitle: string;
  uploadNewTitle: string;
}

const CATEGORY_PROPS: Record<UploadCategoryEnum | string | 'defaultProps', DialogProps> = {
  [UploadCategoryEnum.LEGEND]: {
    maxImageSize: Infinity,
    title: $localize `:@@admin-core.select-upload.select-legend:Select legend`,
    selectExistingTitle: $localize `:@@admin-core.select-upload.select-existing-legend:Select existing legend`,
    uploadNewTitle: $localize `:@@admin-core.select-upload.upload-new-legend:Upload a new legend`,
  },
  [UploadCategoryEnum.APPLICATION_LOGO]: {
    maxImageSize: 600,
    title: $localize `:@@admin-core.select-upload.select-logo:Select logo`,
    selectExistingTitle: $localize `:@@admin-core.select-upload.select-existing-logo:Select existing logo`,
    uploadNewTitle: $localize `:@@admin-core.select-upload.upload-new-logo:Upload a new logo`,
  },
  defaultProps: {
    maxImageSize: Infinity,
    title: $localize `:@@admin-core.select-upload.select-file:Select file`,
    selectExistingTitle: $localize `:@@admin-core.select-upload.select-existing-file:Select existing file`,
    uploadNewTitle: $localize `:@@admin-core.select-upload.upload-new-file:Upload a new file`,
  },
};

@Component({
  selector: 'tm-admin-select-upload-dialog',
  templateUrl: './select-upload-dialog.component.html',
  styleUrls: ['./select-upload-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectUploadDialogComponent implements OnInit {

  public existingUploads$ = new BehaviorSubject<UploadModel[] | null>(null);
  public loading = signal(false);
  public dialogProps: DialogProps;

  constructor(
    private dialogRef: MatDialogRef<SelectUploadDialogComponent, SelectUploadResult>,
    @Inject(MAT_DIALOG_DATA) public data: SelectUploadData,
    @Inject(UPLOAD_REMOVE_SERVICE) private uploadRemoveService: UploadRemoveServiceModel,
    private adminApiService: TailormapAdminApiV1Service,
    private dialog: MatDialog,
    private confirmDialogService: ConfirmDialogService,
    private adminSnackbarService: AdminSnackbarService,
  ) {
    this.dialogProps = CATEGORY_PROPS[this.data.category]
      ? CATEGORY_PROPS[this.data.category]
      : CATEGORY_PROPS['defaultProps'];
  }

  public static open(
    dialog: MatDialog,
    data: SelectUploadData,
    viewContainerRef: ViewContainerRef,
  ): MatDialogRef<SelectUploadDialogComponent, SelectUploadResult> {
    return dialog.open(SelectUploadDialogComponent, { data, width: '680px', viewContainerRef });
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
    const uploadId = upload.id;
    const uploadName = upload.filename;
    this.uploadRemoveService.isImageInUse$(uploadId)
      .pipe(
        take(1),
        concatMap(items => {
          if (items.length > 0) {
            return this.dialog.open(UploadInUseDialogComponent, { data: { items } })
              .afterClosed().pipe(map(() => false));
          }
          return this.confirmDialogService.confirm$(
            $localize `:@@admin-core.upload-select.delete-file:Delete file?`,
            $localize `:@@admin-core.upload-select.delete-file-message:Are you sure you want delete to the file ${uploadName}? This action cannot be undone.`,
            true,
          );
        }),
        concatMap(confirmed => {
          if (confirmed) {
            return this.adminApiService.deleteUpload$(uploadId)
              .pipe(
                catchError(() => of(false)),
                map(success => ({ success: !!success })),
                tap(({ success }) => {
                  if (!success) {
                    this.adminSnackbarService.showMessage($localize `:@@admin-core.upload-select.error-deleting-file:Error removing file ${uploadName}. Please try again.`);
                  }
                }),
              );
          }
          return of({ success: false });
        }),
      )
      .subscribe(response => {
        if (!response.success) {
          return;
        }
        this.existingUploads$.next((this.existingUploads$.value || []).filter(u => u.id !== uploadId));
        this.adminSnackbarService.showMessage($localize `:@@admin-core.upload-select.file-deleted:File ${uploadName} removed`);
      });
  }

}
