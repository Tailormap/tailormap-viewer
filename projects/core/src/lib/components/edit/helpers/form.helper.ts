import { FormFieldModel } from '../models/form-field.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export class FormHelper {

  public static createForm(fields: FormFieldModel[]) {
    const form = new FormGroup({});
    fields.forEach(field => {
      const control = new FormControl(field.value, {
        validators: field.required ? [Validators.required] : [],
      });
      if (field.disabled) {
        control.disable();
      } else {
        control.enable();
      }
      form.addControl(field.name, control);
    });
    return form;
  }

}
