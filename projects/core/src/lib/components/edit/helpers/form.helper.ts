import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { ViewerEditFormFieldModel } from '../models/viewer-edit-form-field.model';

export class FormHelper {

  private static DATE_VALIDATOR_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  private static INTEGER_VALIDATOR_PATTERN = /^-?[0-9]+$/;

  public static createForm(fields: ViewerEditFormFieldModel[], currentUsername?: string) {
    const form = new FormGroup({});
    fields.forEach(field => {
      const validators: ValidatorFn[] = [];
      if (field.required && field.type !== 'boolean') {
        validators.push(Validators.required);
      }
      if (field.type === 'number') {
        validators.push(control=>
          // XXX i18n - only supports point as decimal separator (form control does not allow comma's anyway)
          (isNaN(control?.value) ? { number: true } : null));
      }
      if (field.type === 'integer') {
        validators.push(Validators.pattern(FormHelper.INTEGER_VALIDATOR_PATTERN));
      }
      if (field.type === 'date') {
        validators.push(FormHelper.dateValidator());
      }
      const control = new FormControl(field.value, {
        validators,
        nonNullable: field.required,
      });
      if (field.autoFillUser && currentUsername) {
        control.setValue(currentUsername);
      }
      if (field.autoFillDate) {
        if (field.type === 'date') {
          control.setValue(DateTime.now().toISODate());
        } else if (field.type === 'timestamp') {
          control.setValue(DateTime.now().toISO());
        }
      }
      if (field.disabled) {
        control.disable();
      } else {
        control.enable();
      }
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      form.addControl(field.name, control);
    });
    return form;
  }

  // XXX i18n
  public static dateValidator(): ValidatorFn {
    return (control: AbstractControl) : ValidationErrors | null => {
      if (control.value) {
        const value = FormHelper.getFormValue(control.value);
        const matches = FormHelper.DATE_VALIDATOR_PATTERN.test(`${value}`);
        return matches ? null : { 'invalidDate': true };
      } else {
        return null;
      }
    };
  }

  public static getFormValue(value: string | number | boolean | DateTime) {
    if (DateTime.isDateTime(value)) {
      return value.toISODate();
    }
    return value;
  }

}
