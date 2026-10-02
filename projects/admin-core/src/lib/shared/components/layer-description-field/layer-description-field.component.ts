import {
  ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject, OnInit, ElementRef, viewChild, ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { UploadCategoryEnum } from '@tailormap-viewer/api';
import { HtmlifyHelper } from '@tailormap-viewer/shared';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatInput,
    ReactiveFormsModule,
    CdkTextareaAutosize,
    MatLabel,
    MatFormField,
    MatIconButton,
    MatIcon,
    MatSuffix,
    MatTooltip,
    MatHint,
  ],
})
export class LayerDescriptionFieldComponent implements OnInit, ControlValueAccessor {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private viewContainerRef = inject(ViewContainerRef);

  private textarea = viewChild<ElementRef<HTMLTextAreaElement>>('area');

  public textareaControl = new FormControl('');

  public onTouched: any | null = null;
  private onChange: any | null = null;

  private currentDescription: string | null = null;

  public ngOnInit(): void {
    this.textareaControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter(value => value !== this.currentDescription),
        debounceTime(250),
      )
      .subscribe(description => {
        this.currentDescription = description;
        if (this.onChange) {
          this.onChange(description);
        }
      });
  }

  public writeValue(_description: string | null): void {
    this.currentDescription = _description;
    this.textareaControl.setValue(_description);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.textareaControl.disable();
    } else {
      this.textareaControl.enable();
    }
  }

  public addLink() {
    const pos = this.textarea()?.nativeElement.selectionStart || 0;

    SelectUploadDialogComponent.open(
      this.dialog,
      { category: UploadCategoryEnum.LAYER_ATTACHED_FILE, uploadId: null, showDescriptionField: false },
      this.viewContainerRef,
    )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef), take(1))
      .subscribe(selectResult => {
        if (selectResult?.cancelled || !selectResult?.upload) {
          return;
        }
        const upload = selectResult.upload;

        const isImage = HtmlifyHelper.IMG_REGEXP.test(upload.filename);
        const textToInsert = isImage
          ? ` upload://${upload.id} `
          : `[${upload.filename}](upload://${upload.id})`;
        const value = this.textareaControl.value || '';
        const newValue = value.substring(0, pos) + textToInsert + value.substring(pos);
        this.textareaControl.setValue(newValue);
      });
  }
}
