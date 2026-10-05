import { Component, OnInit, ChangeDetectionStrategy, signal, ViewContainerRef, inject, effect, computed, DestroyRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogTitle, MatDialogActions } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { catchError, concatMap, map, of, take, tap } from 'rxjs';
import { UPLOAD_REMOVE_SERVICE } from '../models/upload-remove-service.injection-token';
import { UploadRemoveServiceModel } from '../models/upload-remove-service.model';
import { UploadInUseDialogComponent } from '../upload-in-use-dialog/upload-in-use-dialog.component';
import {
  ConfirmDialogService, FileHelper, FileContents, HtmlifyHelper, TooltipDirective,
} from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../services/admin-snackbar.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ImageUploadFieldComponent } from '../../image-upload-field/image-upload-field.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FileUploadFieldComponent } from '../../file-upload-field/file-upload-field.component';
import { MatTooltip } from '@angular/material/tooltip';
import { ListFilterComponent } from '../../list-filter/list-filter.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SelectUploadData {
  uploadId: string | null;
  category: UploadCategoryEnum | string;
  showFilesTab?: boolean;
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
    TooltipDirective,
    MatTabGroup,
    MatTab,
    FileUploadFieldComponent,
    MatTooltip,
    ListFilterComponent,
  ],
})
export class SelectUploadDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<SelectUploadDialogComponent, SelectUploadResult>>(MatDialogRef);
  private destroyRef = inject(DestroyRef);
  public data = inject<SelectUploadData>(MAT_DIALOG_DATA);
  private uploadRemoveService = inject<UploadRemoveServiceModel>(UPLOAD_REMOVE_SERVICE);
  private adminApiService = inject(TailormapAdminApiV1Service);
  private dialog = inject(MatDialog);
  private confirmDialogService = inject(ConfirmDialogService);
  private adminSnackbarService = inject(AdminSnackbarService);


  public existingUploads = signal<UploadModel[]>([]);
  public filteredUploads = computed(() => {
    const uploads = this.existingUploads();
    const term = this.filterTerm();
    if (!uploads || !term || term === '') {
      return uploads;
    }
    return uploads.filter(upload => upload.filename.toLowerCase().includes(term.toLowerCase()));
  });
  public filterTerm = signal<string>('');

  public loading = signal(false);
  public dialogProps: DialogProps;
  public fileToUpload = signal<FileContents | null>(null);
  public descriptionControl = new FormControl<string | null>(null);
  public descriptionTooltip = computed(() => {
    const pendingImage = this.fileToUpload();
    return pendingImage
      ? ' '
      : $localize `:@@admin-core.select-upload.description-tooltip:Choose a file to upload, a description can then be added to the uploaded file`;
  });
  public filenameFilterControl = new FormControl<string | null>(null);
  public selectedTab: 'files' | 'images' = this.data.showFilesTab ? 'files' : 'images';

  constructor() {
    this.dialogProps = CATEGORY_PROPS[this.data.category]
      ? CATEGORY_PROPS[this.data.category]
      : CATEGORY_PROPS['defaultProps'];

    effect(() => {
      if (this.fileToUpload()) {
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
        if (uploads !== null) {
          uploads = uploads.sort((a, b) => a.filename.localeCompare(b.filename));
          uploads = uploads.map<UploadModel>(upload => ({
            ...upload,
            contentSize: FileHelper.byteCountToDisplaySize(upload.contentLength),
          }));
        }
        this.existingUploads.set(uploads || []);
        this.loading.set(false);
      });

    this.filenameFilterControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.filterTerm.set(value || '');
    });
  }

  public getFilesTabLabel() {
    const uploads = this.filteredUploads();
    const count = uploads?.filter(u => !this.isImage(u)).length || 0;
    return $localize `:@@admin-core.select-upload.files-tab:Files (${count})`;
  }

  public getImagesTabLabel() {
    const uploads = this.filteredUploads();
    const count = uploads?.filter(this.isImage).length || 0;
    return $localize `:@@admin-core.select-upload.images-tab:Images (${count})`;
  }

  public onTabChange($event: { index: number }) {
    this.selectedTab = $event.index === 0 ? 'files' : 'images';
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

  public fileSelected($event: FileContents | null) {
    this.fileToUpload.set($event);
  }

  public imageSelected($event: { image: string; fileName: string }) {
    const haveImage = $event.image !== '' && $event.fileName !== '';
    const parsed = haveImage ? FileHelper.parseDataUrl($event.image) : null;
    if (parsed === null) {
      this.fileToUpload.set(null);
    } else {
      this.fileToUpload.set({
        filename: $event.fileName,
        dataURL: $event.image,
        contentsBase64: parsed.contentsBase64,
        mimeType: parsed.mimeType,
      });
    }
  }

  public uploadFile() {
    this.loading.set(true);
    const fileToUpload = this.fileToUpload();
    if (!fileToUpload) {
      this.loading.set(false);
      return;
    }
    this.adminApiService.createUpload$({
      content: fileToUpload.contentsBase64,
      filename: fileToUpload.filename,
      category: this.data.category,
      mimeType: fileToUpload.mimeType,
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
        this.existingUploads.set((this.existingUploads() || []).filter(u => u.id !== uploadId));
        this.adminSnackbarService.showMessage($localize `:@@admin-core.upload-select.file-deleted:File ${uploadName} removed`);
      });
  }

}
