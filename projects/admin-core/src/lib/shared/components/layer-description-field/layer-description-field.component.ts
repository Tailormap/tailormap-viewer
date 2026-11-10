import {
  Component, forwardRef, inject, signal, ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, debounceTime, filter, map, Observable, of, Subject, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import {
  FileHelper, MarkdownEditorComponent, MarkdownEditorInsertUploadFn, MarkdownEditorResolveImageUrlFn, MarkdownEditorUploadFn,
} from '@tailormap-viewer/shared';
import { TailormapAdminApiV1Service, UploadModel } from '@tailormap-admin/admin-api';
import { UPLOAD_REMOVE_SERVICE } from '../select-upload/models/upload-remove-service.injection-token';
import { LayerAttachedFileRemoveService } from '../../services/layer-attached-file-remove.service';
import { SelectUploadDialogComponent } from '../select-upload/select-upload-dialog/select-upload-dialog.component';

@Component({
  selector: 'tm-admin-layer-description-field-hint',
  template: `<ng-content></ng-content>`,
})
export class AdminLayerDescriptionFieldHint {}


@Component({
  selector: 'tm-admin-layer-description-field',
  templateUrl: './layer-description-field.component.html',
  styleUrls: ['./layer-description-field.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LayerDescriptionFieldComponent),
      multi: true,
    },
    { provide: UPLOAD_REMOVE_SERVICE,
      useClass: LayerAttachedFileRemoveService },
  ],
  imports: [
    MarkdownEditorComponent,
  ],
})
export class LayerDescriptionFieldComponent implements ControlValueAccessor {
  private dialog = inject(MatDialog);
  private viewContainerRef = inject(ViewContainerRef);
  private adminApiService = inject(TailormapAdminApiV1Service);

  public content = signal<string>('');
  public disabled = signal(false);

  private onChange: ((value: string | null) => void) | null = null;
  public onTouched: (() => void) | null = null;

  private static readonly UPLOAD_URL_PREFIX = 'upload://';

  private currentDescription: string | null = null;

  private userInteracted = false;

  private contentChanges = new Subject<string | null>();

  constructor() {
    this.contentChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(250),
        filter((content): content is string => content !== null && content !== (this.currentDescription ?? '')),
      )
      .subscribe(content => {
        this.currentDescription = content;
        this.onChange?.(content);
      });
  }

  public writeValue(description: string | null): void {
    if (description === this.currentDescription) {
      return;
    }
    this.contentChanges.next(null);
    this.userInteracted = false;
    this.currentDescription = description;
    this.content.set(description ?? '');
  }

  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public onInteraction() {
    this.userInteracted = true;
  }

  public onContentChanged(content: string) {
    if (!this.userInteracted) {
      return;
    }
    this.contentChanges.next(content);
  }

  /**
   * Opens the dialog to select or upload a file and returns Markdown for the selected upload
   */
  public selectUpload$: MarkdownEditorInsertUploadFn = (): Observable<string | null> => {
    return SelectUploadDialogComponent.open(
      this.dialog,
      { category: UploadCategoryEnum.LAYER_ATTACHED_FILE, uploadId: null, showDescriptionField: false, showFilesTab: true },
      this.viewContainerRef,
    )
      .afterClosed()
      .pipe(
        take(1),
        map(selectResult => (selectResult?.cancelled || !selectResult?.upload
          ? null
          : LayerDescriptionFieldComponent.getMarkdownForUpload(selectResult.upload))),
      );
  };

  /**
   * Uploads a file which was dropped or pasted in the editor as a layer attached file and returns an `upload://{id}`
   * URL, the same URL as used by {@link selectUpload$}.
   */
  public uploadFile$: MarkdownEditorUploadFn = (file: File) => {
    return FileHelper.readFileContents(file)
      .pipe(
        concatMap(contents => {
          if (!contents) {
            return of({ error: $localize `:@@admin-core.layer-description.error-reading-file:Error reading file` });
          }
          return this.adminApiService.createUpload$({
            content: contents.contentsBase64,
            filename: contents.filename,
            category: UploadCategoryEnum.LAYER_ATTACHED_FILE,
            mimeType: contents.mimeType,
          }).pipe(
            take(1),
            map(upload => ({ url: LayerDescriptionFieldComponent.getUploadUrl(upload) })),
            catchError(() => of({ error: $localize `:@@admin-core.layer-description.error-uploading-file:Error uploading file` })),
          );
        }),
      );
  };

  /**
   * Returns the admin URL for an `upload://{id}` URL, so the editor can display an uploaded image. Other URLs are
   * returned unchanged.
   */
  public resolveImageUrl: MarkdownEditorResolveImageUrlFn = (url: string): string => {
    const uploadId = url.startsWith(LayerDescriptionFieldComponent.UPLOAD_URL_PREFIX)
      ? url.substring(LayerDescriptionFieldComponent.UPLOAD_URL_PREFIX.length)
      : null;
    return uploadId ? UploadedFileHelper.getAdminUrlForFile(uploadId, UploadCategoryEnum.LAYER_ATTACHED_FILE) : url;
  };

  public static getUploadUrl(upload: Pick<UploadModel, 'id'>): string {
    return `${LayerDescriptionFieldComponent.UPLOAD_URL_PREFIX}${upload.id}`;
  }

  public static getMarkdownForUpload(upload: UploadModel): string {
    const url = LayerDescriptionFieldComponent.getUploadUrl(upload);
    if (upload.mimeType?.startsWith('image/')) {
      return `![](${url})`;
    }
    const label = (upload.description || upload.filename).replace(/[\\[\]]/g, '\\$&');
    return `[${label}](${url})`;
  }

}
