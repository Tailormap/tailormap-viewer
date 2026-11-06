import {
  Component, forwardRef, inject, signal, ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, map, Observable, Subject, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import { MarkdownEditorComponent, MarkdownHelper } from '@tailormap-viewer/shared';
import { UploadModel } from '@tailormap-admin/admin-api';
import { UPLOAD_REMOVE_SERVICE } from '../select-upload/models/upload-remove-service.injection-token';
import { LayerAttachedFileRemoveService } from '../../services/layer-attached-file-remove.service';
import { SelectUploadDialogComponent } from '../select-upload/select-upload-dialog/select-upload-dialog.component';
import { AdminImageUploadService, ImageUploadResult } from '../../services/admin-image-upload.service';

@Component({
  selector: 'tm-admin-layer-description-field-hint',
  template: `<ng-content></ng-content>`,
})
export class AdminLayerDescriptionFieldHint {}

const UPLOAD_REFERENCE_REGEXP = /^upload:\/\/([^/\s?#]+)/;

let nextId = 0;

/**
 * Form field to edit a layer description as Markdown. Uploads (images and files) are inserted as `upload://<id>`
 * references, which the backend replaces by the URL of the upload when serving the viewer configuration. The
 * LayerAttachedFileRemoveService also searches for these references to check whether an upload is in use.
 */
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
  private adminImageUploadService = inject(AdminImageUploadService);

  public labelId = `tm-admin-layer-description-field-label-${nextId++}`;
  public content = signal<string>('');
  public disabled = signal(false);

  private onChange: ((value: string | null) => void) | null = null;
  public onTouched: (() => void) | null = null;

  private currentDescription: string | null = null;

  /**
   * Set on interaction with the editor and reset on writeValue(). The visual editor may emit a normalized version of
   * a value written by the form; such changes are not changes by the user and should not mark the form as changed.
   */
  private userInteracted = false;

  /**
   * Debounced content changes by the user. writeValue() emits null, which replaces a pending (debounced) change for
   * the previous value so that change is dropped.
   */
  private contentChanges = new Subject<string | null>();

  public imageUrlTransform = LayerDescriptionFieldComponent.getUploadDisplayUrl;

  public uploadImage$ = (file: File): Observable<ImageUploadResult | null> => this.adminImageUploadService.uploadLayerAttachedImage$(file);

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
   * Opens the dialog to select or upload a file and returns Markdown for the selected upload: an image for images,
   * otherwise a link. Returns null when the dialog was cancelled.
   */
  public selectUpload$ = (): Observable<string | null> => {
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

  public static getMarkdownForUpload(upload: UploadModel): string {
    const isImage = upload.mimeType?.startsWith('image/') ?? false;
    const label = MarkdownHelper.markdownEscape(
      (isImage ? upload.imageAltText : null) || upload.description || upload.filename,
    );
    return `${isImage ? '!' : ''}[${label}](upload://${upload.id})`;
  }

  /**
   * Returns a URL the admin can load for `upload://<id>` references, other URLs are returned unchanged.
   */
  public static getUploadDisplayUrl(src: string): string {
    const match = UPLOAD_REFERENCE_REGEXP.exec(src);
    if (!match) {
      return src;
    }
    return UploadedFileHelper.getAdminUrlForFile(match[1], UploadCategoryEnum.LAYER_ATTACHED_FILE);
  }
}
