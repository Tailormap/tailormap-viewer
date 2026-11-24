import { Component, booleanAttribute, computed, effect, forwardRef, inject, input } from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { DateTime } from 'luxon';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatTimepicker, MatTimepickerInput, MatTimepickerToggle } from '@angular/material/timepicker';

const INVALID_DATE_TIME_ERROR = 'invalidDateTime';

let nextId = 0;

/**
 * Form control for a date and time, using a Material datepicker and timepicker. Use it with a reactive form directive
 * (`formControl` or `formControlName`). The content of the element is used as the label, for example:
 *
 * ```html
 * <tm-datetime-field formControlName="validUntil"><span i18n="@@valid-until">Valid until</span></tm-datetime-field>
 * ```
 *
 * The date and time each have their own internal control and are combined into one value. They can't share a single control
 * because selecting a date in the datepicker resets the time to midnight (the timepicker does keep the date).
 *
 * The value of this control is an ISO 8601 timestamp string with the offset of the local time zone (for example
 * `2026-11-18T14:30:00.000+01:00`), or `null` when no date is entered. Values written to the control can be ISO 8601 strings,
 * JavaScript `Date` objects or Luxon `DateTime` objects.
 *
 * With the `required` input the date is required: the form control has the `required` error when no date is entered. Text
 * which can't be parsed as a date or time makes the form control invalid with the `invalidDateTime` error.
 *
 * Errors are shown on the date and time fields themselves, by default (like other Material inputs) when that field is touched
 * or the form is submitted. Pass an `errorStateMatcher` to change that, for example to show errors immediately.
 */
@Component({
  selector: 'tm-datetime-field',
  templateUrl: './datetime-field.component.html',
  styleUrls: ['./datetime-field.component.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatetimeFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DatetimeFieldComponent), multi: true },
  ],
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatTimepicker,
    MatTimepickerInput,
    MatTimepickerToggle,
  ],
})
export class DatetimeFieldComponent implements ControlValueAccessor, Validator {
  private defaultErrorStateMatcher = inject(ErrorStateMatcher);

  public placeholder = input<string>('');
  public hideRequiredMarker = input(false, { transform: booleanAttribute });
  public required = input(false, { transform: booleanAttribute });
  /** Decides when errors are shown on the date and time fields. When not set, the default Material behavior is used. */
  public errorStateMatcher = input<ErrorStateMatcher | null>(null);
  public fieldErrorStateMatcher = computed(() => this.errorStateMatcher() ?? this.defaultErrorStateMatcher);

  public labelId = `tm-datetime-field-label-${nextId++}`;

  public dateControl = new FormControl<DateTime | null>(null);
  public timeControl = new FormControl<DateTime | null>(null);

  private onChange: ((value: string | null) => void) | null = null;
  private onTouched: (() => void) | null = null;
  private onValidatorChange: (() => void) | null = null;

  constructor() {
    merge(this.dateControl.valueChanges, this.timeControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onChange?.(this.getValue()));

    // Revalidate the form control when the required input changes. The first run is skipped: the form control is validated
    // when it is set up, and revalidating also emits a value change.
    let firstRun = true;
    effect(() => {
      this.required();
      if (!firstRun) {
        this.onValidatorChange?.();
      }
      firstRun = false;
    });
  }

  /**
   * No `markForCheck()` is needed here or in `setDisabledState()`: the Material inputs of the internal controls emit state
   * changes, on which their form field marks itself and this component for check.
   */
  public writeValue(value: unknown): void {
    const dateTime = DatetimeFieldComponent.parseValue(value);
    this.dateControl.setValue(dateTime, { emitEvent: false });
    this.timeControl.setValue(dateTime, { emitEvent: false });
  }

  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.dateControl.disable({ emitEvent: false });
      this.timeControl.disable({ emitEvent: false });
    } else {
      this.dateControl.enable({ emitEvent: false });
      this.timeControl.enable({ emitEvent: false });
    }
  }

  /**
   * Reports the errors of the internal controls. Without this, text which can't be parsed as a date or time would result in a
   * valid `null` value for an optional field. The required error is derived from the `required` input instead of from the
   * internal date control, because the form control is validated before the required validator of the date input is set up.
   */
  public validate(_control: AbstractControl): ValidationErrors | null {
    if (this.dateControl.disabled) {
      return null;
    }
    const errors = { ...this.dateControl.errors, ...this.timeControl.errors };
    delete errors['required'];
    if (Object.keys(errors).length > 0) {
      return { [INVALID_DATE_TIME_ERROR]: true };
    }
    return this.required() && !this.dateControl.value ? { required: true } : null;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  public markAsTouched(): void {
    this.onTouched?.();
  }

  private getValue(): string | null {
    const date = this.dateControl.value;
    if (!date || !date.isValid) {
      return null;
    }
    const time = this.timeControl.value?.isValid ? this.timeControl.value : null;
    return date.set({
      hour: time?.hour ?? 0,
      minute: time?.minute ?? 0,
      second: time?.second ?? 0,
      millisecond: time?.millisecond ?? 0,
    }).toISO();
  }

  private static parseValue(value: unknown): DateTime | null {
    let dateTime: DateTime | null = null;
    if (DateTime.isDateTime(value)) {
      dateTime = value;
    } else if (value instanceof Date) {
      dateTime = DateTime.fromJSDate(value);
    } else if (typeof value === 'string' && value.trim() !== '') {
      dateTime = DateTime.fromISO(value);
    }
    return dateTime?.isValid ? dateTime : null;
  }
}
