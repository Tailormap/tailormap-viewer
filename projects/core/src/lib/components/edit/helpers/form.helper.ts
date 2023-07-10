import { FormFieldModel } from '../models/form-field.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export class FormHelper {

  public static createForm(fields: FormFieldModel[]) {
    const form = new FormGroup({});
    fields.forEach(field => {
      const control = new FormControl(field.value, {
        validators: field.required ? [Validators.required] : [],
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
