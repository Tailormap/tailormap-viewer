import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, form, required } from '@angular/forms/signals';
import { BehaviorSubject, concatMap, of } from 'rxjs';
import { FormModel } from '@tailormap-admin/admin-api';
import { AutoFocusDirective } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { FormService } from '../services/form.service';
import { selectForms } from '../state/form.selectors';
import { FormNameHelper } from '../helpers/form-name.helper';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

export interface FormCopyDialogData {
  formId: number;
  formName: string;
  featureSourceId: number;
  featureTypeName: string;
}

/**
 * Dialog to copy a form under a new name. The copy is made from the saved form as returned by the API (not from unsaved draft
 * changes) and keeps the same feature type, fields and tabs. The default name is made unique for the feature type.
 */
@Component({
  selector: 'tm-admin-form-copy-dialog',
  templateUrl: './form-copy-dialog.component.html',
  styleUrls: ['./form-copy-dialog.component.css'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatError,
    MatHint,
    MatInput,
    MatButton,
    FormField,
    AutoFocusDirective,
    SaveButtonComponent,
  ],
})
export class FormCopyDialogComponent {
  public data = inject<FormCopyDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<FormCopyDialogComponent, FormModel | null>>(MatDialogRef);
  private formService = inject(FormService);
  private destroyRef = inject(DestroyRef);
  private forms = inject(Store).selectSignal(selectForms);

  private copyModel = signal({
    name: FormNameHelper.getUniqueName(
      this.forms(),
      $localize `:@@admin-core.form.copy-of:Copy of ${this.data.formName}`,
      this.data.featureSourceId,
      this.data.featureTypeName,
    ),
  });
  public copyForm = form(this.copyModel, schema => {
    required(schema.name);
  });

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();
  public errorMessage = signal<string | null>(null);
  public nameTaken = computed(() => FormNameHelper.isNameTaken(
    this.forms(),
    this.copyModel().name,
    this.data.featureSourceId,
    this.data.featureTypeName,
  ));
  public valid = computed(() => this.copyForm().valid() && this.copyModel().name.trim() !== '' && !this.nameTaken());

  public static open(
    dialog: MatDialog,
    data: FormCopyDialogData,
  ): MatDialogRef<FormCopyDialogComponent, FormModel | null> {
    return dialog.open(FormCopyDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close(null);
  }

  public save() {
    if (!this.valid() || this.savingSubject.value) {
      return;
    }
    const name = this.copyModel().name.trim();
    this.errorMessage.set(null);
    this.savingSubject.next(true);
    this.formService.getForm$(this.data.formId)
      .pipe(
        concatMap(original => {
          if (!original) {
            return of(undefined);
          }
          return this.formService.createForm$(FormCopyDialogComponent.createCopy(original, name));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        this.savingSubject.next(false);
        if (result === undefined) {
          this.errorMessage.set($localize `:@@admin-core.form.error-loading-form:Error while loading form`);
          return;
        }
        if (result) {
          this.dialogRef.close(result);
        }
      });
  }

  /**
   * Only copy the known form properties, the API response may contain extra properties such as _links.
   */
  public static createCopy(original: FormModel, name: string): Omit<FormModel, 'id'> {
    return {
      name,
      featureSourceId: original.featureSourceId,
      featureTypeName: original.featureTypeName,
      fields: original.fields,
      options: {
        adminComments: original.options?.adminComments,
        tabs: original.options?.tabs || [],
      },
    };
  }

}
