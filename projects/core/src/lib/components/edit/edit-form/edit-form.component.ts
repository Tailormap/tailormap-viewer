import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormFieldModel } from '../models/form-field.model';
import { FormHelper } from '../helpers/form.helper';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tm-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditFormComponent {

  private _formConfig: FormFieldModel[] = [];
  private currentFormSubscription: Subscription | undefined;

  @Input({ required: true })
  public set formConfig(formConfig: FormFieldModel[]) {
    this._formConfig = formConfig || [];
    this.createForm();
  }
  public get formConfig(): FormFieldModel[] {
    return this._formConfig;
  }

  public form: FormGroup = new FormGroup({});

  private createForm() {
    if (this.currentFormSubscription) {
      this.currentFormSubscription.unsubscribe();
    }
    this.form = FormHelper.createForm(this.formConfig);
    this.currentFormSubscription = this.form.valueChanges
      .subscribe(value => {
        console.log('Form value changed', value);
      });
  }

}
