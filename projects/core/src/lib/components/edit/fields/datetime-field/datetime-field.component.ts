import { ChangeDetectorRef, Component, DestroyRef, OnInit, forwardRef, inject, input } from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { DateTime } from 'luxon';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatTimepicker, MatTimepickerInput, MatTimepickerToggle } from '@angular/material/timepicker';
import { ViewerEditFormFieldModel } from '../../models/viewer-edit-form-field.model';

/**
 * Form control for a timestamp attribute, using a Material datepicker and timepicker.
 *
 * The date and time each have their own internal control and are combined into one value. They can't share a single control
 * because selecting a date in the datepicker resets the time to midnight (the timepicker does keep the date).
 *
 * The value of this control is an ISO 8601 timestamp string with the offset of the local time zone (for example
 * `2026-11-18T14:30:00.000+01:00`), or `null` when no date is entered. Values written to the control are parsed as ISO 8601.
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
export class DatetimeFieldComponent implements OnInit, ControlValueAccessor, Validator {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  public item = input.required<ViewerEditFormFieldModel>();

  public dateControl = new FormControl<DateTime | null>(null);
  public timeControl = new FormControl<DateTime | null>(null);

  private onChange: ((value: string | null) => void) | null = null;
  private onTouched: (() => void) | null = null;

  public ngOnInit(): void {
    if (this.item().required) {
      this.dateControl.addValidators(Validators.required);
    }
    // Show validation errors (such as an unparseable date) immediately, like the other fields in the edit form
    this.dateControl.markAsTouched();
    this.timeControl.markAsTouched();
    merge(this.dateControl.valueChanges, this.timeControl.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChange?.(this.getValue()));
  }

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
    this.cdr.markForCheck();
  }

  /**
   * Reports the errors of the internal controls. Without this, text which can't be parsed as a date or time would result in a
   * valid `null` value for an optional field.
   */
  public validate(_control: AbstractControl): ValidationErrors | null {
    if (this.dateControl.disabled) {
      return null;
    }
    const errors = { ...this.dateControl.errors, ...this.timeControl.errors };
    delete errors['required'];
    return Object.keys(errors).length > 0 ? { invalidDateTime: true } : null;
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
    if (DateTime.isDateTime(value)) {
      return value.isValid ? value : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const dateTime = DateTime.fromISO(value);
      return dateTime.isValid ? dateTime : null;
    }
    return null;
  }
}
