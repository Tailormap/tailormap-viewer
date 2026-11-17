import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { ApplicationModelHelper } from '../../application/helpers/application-model.helper';
import { Routes } from '../../routes';
import { FormUsageModel } from '../helpers/form-usage.helper';

export interface FormUsedDialogData {
  formName: string;
  usages: FormUsageModel[];
}

/**
 * Shown instead of the delete confirmation when app layers still use the form.
 */
@Component({
  selector: 'tm-admin-form-used-dialog',
  templateUrl: './form-used-dialog.component.html',
  styleUrls: ['./form-used-dialog.component.css'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    RouterLink,
    MatButton,
  ],
})
export class FormUsedDialogComponent {
  public data = inject<FormUsedDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<FormUsedDialogComponent>>(MatDialogRef);

  public getLabel(usage: FormUsageModel) {
    return `${ApplicationModelHelper.getApplicationLabel(usage.application)}: ${usage.layerTitle}`;
  }

  public getUrl(usage: FormUsageModel) {
    return ApplicationModelHelper.getApplicationUrl(usage.application, Routes.APPLICATION_DETAILS_LAYERS);
  }

  public close() {
    this.dialogRef.close();
  }

}
