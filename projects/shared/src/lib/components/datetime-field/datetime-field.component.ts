import { Component, booleanAttribute, computed, effect, forwardRef, inject, input } from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateTime } from 'luxon';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

/** The format of the value of a native `datetime-local` input. */
const NATIVE_FORMAT = "yyyy-MM-dd'T'HH:mm";

/** Error state matcher for the `showErrorsImmediately` input. */
const SHOW_ERRORS_IMMEDIATELY: ErrorStateMatcher = { isErrorState: control => !!control?.invalid };

/**
 * Form control for a date and time, using the native `datetime-local` input of the browser. Use it with a reactive form
 * directive (`formControl` or `formControlName`). The content of the element is used as the label, for example:
 *
 * ```html
 * <tm-datetime-field formControlName="validUntil"><span i18n="@@valid-until">Valid until</span></tm-datetime-field>
 * ```
 *
 * The value of this control is an ISO 8601 timestamp string with the offset of the local time zone (for example
 * `2026-11-18T14:30:00.000+01:00`), or `null` when nothing is entered. Values written to the control can be ISO 8601 strings,
 * JavaScript `Date` objects or Luxon `DateTime` objects.
 *
 * With the `required` input a value is required. Errors are shown (like other Material inputs) when the field is touched or
 * the form is submitted; set `showErrorsImmediately` to show them as soon as the form control is invalid.
 *
 * Limitations of the native input:
 * - The display format and the picker follow the locale of the browser or OS, not the locale of the app.
 * - Seconds are not shown, and are dropped when the value is changed.
 * - Text which is entered partially or can't be parsed makes the browser report an empty value, so the value is `null`.
 */
@Component({
  selector: 'tm-datetime-field',
  templateUrl: './datetime-field.component.html',
  styleUrls: ['./datetime-field.component.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatetimeFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DatetimeFieldComponent), multi: true },
  ],
  imports: [ ReactiveFormsModule, MatFormField, MatLabel, MatSuffix, MatInput, MatIconButton, MatIcon ],
})
export class DatetimeFieldComponent implements ControlValueAccessor, Validator {
  private defaultErrorStateMatcher = inject(ErrorStateMatcher);

  public hideRequiredMarker = input(false, { transform: booleanAttribute });
  public required = input(false, { transform: booleanAttribute });
  /** Shows errors as soon as the form control is invalid, instead of after touching the field or submitting the form. */
  public showErrorsImmediately = input(false, { transform: booleanAttribute });
  public fieldErrorStateMatcher = computed(() => this.showErrorsImmediately() ? SHOW_ERRORS_IMMEDIATELY : this.defaultErrorStateMatcher);

  /** Holds the value of the native input, in the `yyyy-MM-ddTHH:mm` format. */
  public inputControl = new FormControl<string | null>(null);

  private onChange: ((value: string | null) => void) | null = null;
  private onTouched: (() => void) | null = null;
  private onValidatorChange: (() => void) | null = null;

  constructor() {
    this.inputControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.onChange?.(DatetimeFieldComponent.toIso(value)));

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

  public writeValue(value: unknown): void {
    this.inputControl.setValue(DatetimeFieldComponent.toNative(value), { emitEvent: false });
  }

  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  public validate(_control: AbstractControl): ValidationErrors | null {
    if (this.inputControl.disabled) {
      return null;
    }
    return this.required() && !this.inputControl.value ? { required: true } : null;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  public markAsTouched(): void {
    this.onTouched?.();
  }

  /**
   * Opens the picker of the browser. Material hides the picker icon of Chrome, and Firefox and Safari have none, so this
   * component shows its own button. When the picker can't be opened (for example in browsers without `showPicker()`, before
   * Firefox 101 and Safari 16.4), the input is focused instead.
   */
  public openPicker(nativeInput: HTMLInputElement): void {
    try {
      nativeInput.showPicker();
    } catch {
      nativeInput.focus();
    }
  }

  private static toIso(value: string | null): string | null {
    const dateTime = value ? DateTime.fromISO(value) : null;
    return dateTime?.isValid ? dateTime.toISO() : null;
  }

  private static toNative(value: unknown): string | null {
    let dateTime: DateTime | null = null;
    if (DateTime.isDateTime(value)) {
      dateTime = value;
    } else if (value instanceof Date) {
      dateTime = DateTime.fromJSDate(value);
    } else if (typeof value === 'string' && value.trim() !== '') {
      dateTime = DateTime.fromISO(value);
    }
    // Converted to the local time zone, as the native input has no time zone
    return dateTime?.isValid ? dateTime.toLocal().toFormat(NATIVE_FORMAT) : null;
  }
}
