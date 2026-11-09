import {
  Component, forwardRef, inject, signal, ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, map, Observable, Subject, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import { MarkdownEditorComponent } from '@tailormap-viewer/shared';
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

  public content = signal<string>('');
  public disabled = signal(false);

  private onChange: ((value: string | null) => void) | null = null;
  public onTouched: (() => void) | null = null;

  private currentDescription: string | null = null;

  private userInteracted = false;

  private contentChanges = new Subject<string | null>();

  public uploadImage$ = (file: File): Observable<ImageUploadResult | null> => this.adminImageUploadService.uploadImage$(file);

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
  public selectUpload$ = (): Observable<string | null> => {
    return SelectUploadDialogComponent.open(
      this.dialog,
      { category: UploadCategoryEnum.IMAGE, uploadId: null, showDescriptionField: false, showFilesTab: false },
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
    const url = UploadedFileHelper.getUrlForFile(upload.id, upload.category, upload.filename);
    return `![](${url})`;
  }

}
