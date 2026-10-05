import { Component, OnInit, ChangeDetectionStrategy, signal, ViewContainerRef, inject, effect, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogTitle, MatDialogActions } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, concatMap, map, of, take, tap } from 'rxjs';
import { UPLOAD_REMOVE_SERVICE } from '../models/upload-remove-service.injection-token';
import { UploadRemoveServiceModel } from '../models/upload-remove-service.model';
import { UploadInUseDialogComponent } from '../upload-in-use-dialog/upload-in-use-dialog.component';
import { ConfirmDialogService, FileHelper, HtmlifyHelper, TooltipDirective } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../services/admin-snackbar.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ImageUploadFieldComponent } from '../../image-upload-field/image-upload-field.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';

export interface SelectUploadData {
  uploadId: string | null;
  category: UploadCategoryEnum | string;
  showDescriptionField: boolean;
}

export interface SelectUploadResult {
  uploadId?: string;
  upload?: UploadModel;
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
    imports: [
        MatDialogTitle,
        MatProgressSpinner,
        MatIconButton,
        MatIcon,
        ImageUploadFieldComponent,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatDialogActions,
        MatButton,
        AsyncPipe,
        TooltipDirective,
    ],
})
export class SelectUploadDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<SelectUploadDialogComponent, SelectUploadResult>>(MatDialogRef);
  public data = inject<SelectUploadData>(MAT_DIALOG_DATA);
  private uploadRemoveService = inject<UploadRemoveServiceModel>(UPLOAD_REMOVE_SERVICE);
  private adminApiService = inject(TailormapAdminApiV1Service);
  private dialog = inject(MatDialog);
  private confirmDialogService = inject(ConfirmDialogService);
  private adminSnackbarService = inject(AdminSnackbarService);


  public existingUploads$ = new BehaviorSubject<UploadModel[] | null>(null);
  public loading = signal(false);
  public dialogProps: DialogProps;
  public pendingImage = signal<{ image: string; fileName: string} | null>(null);
  public descriptionControl = new FormControl<string | null>(null);
  public descriptionTooltip = computed(() => {
    const pendingImage = this.pendingImage();
    return pendingImage
      ? ' '
      : $localize `:@@admin-core.select-upload.description-tooltip:Choose a file to upload, a description can then be added to the uploaded file`;
  });

  constructor() {
    this.dialogProps = CATEGORY_PROPS[this.data.category]
      ? CATEGORY_PROPS[this.data.category]
      : CATEGORY_PROPS['defaultProps'];

    effect(() => {
      if (this.pendingImage()) {
        this.descriptionControl.enable();
      } else {
        this.descriptionControl.disable();
      }
    });
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
          contentSize: FileHelper.byteCountToDisplaySize(upload.contentLength),
        })));
        this.loading.set(false);
      });
  }

  public isImage(upload: UploadModel) {
    return HtmlifyHelper.IMG_REGEXP.test(upload.filename);
  }

  public dismiss(): void {
    this.dialogRef.close({ cancelled: true });
  }

  public selectFile(upload: UploadModel) {
    this.dialogRef.close({ cancelled: false, upload, uploadId: upload.id });
  }

  public imageSelected($event: { image: string; fileName: string }) {
    if ($event.image === '' && $event.fileName === '') {
      this.pendingImage.set(null);
      return;
    }
    this.pendingImage.set($event);
  }

  public saveImage() {
    this.loading.set(true);
    const pendingImage = this.pendingImage();
    const parsed = pendingImage ? FileHelper.parseDataUrl(pendingImage.image) : null;
    if (!pendingImage || !parsed) {
      this.loading.set(false);
      return;
    }
    this.adminApiService.createUpload$({
      content: parsed.contentsBase64,
      filename: pendingImage.fileName,
      category: this.data.category,
      mimeType: parsed.mimeType,
      description: this.descriptionControl.value || undefined,
    })
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(upload => {
        this.loading.set(false);
        if (upload) {
          this.dialogRef.close({ cancelled: false, upload, uploadId: upload.id });
        }
      });
  }

  public getImg(upload: UploadModel) {
    return UploadedFileHelper.getAdminUrlForFile(upload.id, upload.category, upload.filename);
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
