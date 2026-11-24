import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon';
import { DatetimeFieldComponent } from './datetime-field.component';

const showErrorsImmediately: ErrorStateMatcher = { isErrorState: control => !!control?.invalid };

const setup = async (value: string | Date | null, required = false, errorStateMatcher: ErrorStateMatcher | null = null) => {
  const control = new FormControl<string | Date | null>(value);
  const { detectChanges, fixture } = await render(
    `<tm-datetime-field [formControl]="control" placeholder="Pick a date" [required]="required"
                        [errorStateMatcher]="errorStateMatcher">Timestamp</tm-datetime-field>`,
    {
      imports: [ DatetimeFieldComponent, ReactiveFormsModule ],
      providers: [provideLuxonDateAdapter()],
      componentProperties: { control, required, errorStateMatcher },
    },
  );
  const dateInput = screen.getByRole('textbox', { name: /Timestamp/ });
  const timeInput = screen.getByRole('combobox', { name: 'Time' });
  return { control, dateInput, timeInput, detectChanges, fixture };
};

/** Tests run with TZ=UTC (see test-globals.ts), so the local time is the UTC time. */
const toUtcIso = (value: string | Date | null) => typeof value === 'string' ? DateTime.fromISO(value).toUTC().toISO() : value;

describe('DatetimeFieldComponent', () => {

  test('shows the date and time of the value', async () => {
    const { dateInput, timeInput } = await setup('2026-10-21T10:30:00.000Z');
    expect(screen.getByRole('group', { name: 'Timestamp' })).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('placeholder', 'Pick a date');
    expect(dateInput).toHaveValue('10/21/2026');
    expect(timeInput).toHaveValue('10:30 AM');
  });

  test('accepts a Date value', async () => {
    const { dateInput, timeInput } = await setup(new Date('2026-10-21T10:30:00.000Z'));
    expect(dateInput).toHaveValue('10/21/2026');
    expect(timeInput).toHaveValue('10:30 AM');
  });

  test('keeps the time when changing the date', async () => {
    const { control, dateInput } = await setup('2026-10-21T10:30:15.000Z');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '11/5/2026');
    expect(toUtcIso(control.value)).toBe('2026-11-05T10:30:15.000Z');
    expect(control.valid).toBe(true);
  });

  test('keeps the date when changing the time', async () => {
    const { control, timeInput } = await setup('2026-10-21T10:30:00.000Z');
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '2:15 PM');
    expect(toUtcIso(control.value)).toBe('2026-10-21T14:15:00.000Z');
  });

  test('uses midnight when only a date is entered', async () => {
    const { control, dateInput } = await setup(null);
    await userEvent.type(dateInput, '11/5/2026');
    expect(toUtcIso(control.value)).toBe('2026-11-05T00:00:00.000Z');
  });

  test('is null when the date is cleared', async () => {
    const { control, dateInput } = await setup('2026-10-21T10:30:00.000Z');
    await userEvent.clear(dateInput);
    expect(control.value).toBeNull();
    expect(control.valid).toBe(true);
  });

  test('is invalid when the date can not be parsed', async () => {
    const { control, dateInput } = await setup(null);
    await userEvent.type(dateInput, 'not a date');
    expect(control.value).toBeNull();
    expect(control.hasError('invalidDateTime')).toBe(true);
    await userEvent.tab();
    expect(dateInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('is required with the required input and shows the error after touching the date', async () => {
    const { control, dateInput } = await setup(null, true);
    expect(dateInput).toBeRequired();
    expect(control.hasError('required')).toBe(true);
    // Material omits aria-invalid for an empty required input, so check the error state of the form field
    expect(dateInput.closest('mat-form-field')).not.toHaveClass('mat-form-field-invalid');
    await userEvent.click(dateInput);
    await userEvent.tab();
    expect(dateInput.closest('mat-form-field')).toHaveClass('mat-form-field-invalid');
    expect(control.touched).toBe(true);
  });

  test('is valid when required and a date is entered', async () => {
    const { control, dateInput } = await setup(null, true);
    await userEvent.type(dateInput, '11/5/2026');
    expect(control.valid).toBe(true);
  });

  test('is not required without the required input', async () => {
    const { control, dateInput } = await setup(null);
    expect(dateInput).not.toBeRequired();
    expect(control.valid).toBe(true);
  });

  test('revalidates when the required input changes', async () => {
    const { control, fixture, detectChanges } = await setup(null);
    expect(control.valid).toBe(true);
    fixture.componentInstance.required = true;
    detectChanges();
    expect(control.hasError('required')).toBe(true);
  });

  test('shows errors immediately with an error state matcher', async () => {
    const { dateInput } = await setup(null, true, showErrorsImmediately);
    expect(dateInput.closest('mat-form-field')).toHaveClass('mat-form-field-invalid');
  });

  test('disables the inputs when the control is disabled', async () => {
    const { control, dateInput, timeInput, detectChanges } = await setup('2026-10-21T10:30:00.000Z');
    control.disable();
    detectChanges();
    expect(dateInput).toBeDisabled();
    expect(timeInput).toBeDisabled();
  });
});
