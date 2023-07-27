import { FormFieldModel } from '../models/form-field.model';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

export class FormHelper {

  public static createForm(fields: FormFieldModel[]) {
    const form = new FormGroup({});
    fields.forEach(field => {
      const validators: ValidatorFn[] = [];
      if (field.required && field.type !== 'boolean') {
        validators.push(Validators.required);
      }
      if (field.type === 'number') {
        validators.push(Validators.pattern(/^-?\d+$/));
      }
      if (field.type === 'integer') {
        validators.push(Validators.pattern(/^-?[0-9]+$/));
      }
      if (field.type === 'date') {
        validators.push(Validators.pattern(/^\d{4}-\d{2}-\d{2}$/));
      }
      const control = new FormControl(field.value, {
        validators,
        nonNullable: field.required,
      });
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

}
